const User = require("../models/User");
const EmergencyRequest = require("../models/EmergencyRequest");
const Notification = require("../models/Notification");
const Hospital = require("../models/Hospital");
const {
  sendTestSms,
  sendEmergencySms,
  isTwilioConfigured,
  formatPhoneNumber,
} = require("../services/smsService");

// ============================================================
// SEND TEST SMS NOTIFICATION
// ============================================================
const sendTestNotification = async (req, res) => {
  try {
    const { phone, name, relation, patientId } = req.body;

    let targetPhone = phone;
    let targetName = name || "Emergency Contact";
    let targetRelation = relation || "Contact";
    let senderName = "Patient";

    // If patientId provided or authenticated user, fetch details
    const userId = patientId || req.user?._id;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        senderName = user.name;
        if (!targetPhone && user.emergencyContact?.phone) {
          targetPhone = user.emergencyContact.phone;
          targetName = user.emergencyContact.name || targetName;
          targetRelation = user.emergencyContact.relation || targetRelation;
        }
      }
    }

    if (!targetPhone) {
      return res.status(400).json({
        message: "A recipient phone number is required to send a test SMS",
      });
    }

    const result = await sendTestSms({
      to: targetPhone,
      recipientName: targetName,
      patientName: senderName,
      relation: targetRelation,
      patientId: userId || null,
    });

    res.status(200).json({
      message: result.simulated
        ? "Test SMS simulated successfully in server console (Twilio credentials not yet configured in .env)"
        : `Test SMS sent successfully to ${result.phone}`,
      result,
    });
  } catch (error) {
    console.error("TEST SMS ERROR:", error);
    res.status(500).json({
      message: "Failed to send test SMS",
      error: error.message,
    });
  }
};

// ============================================================
// RESEND EMERGENCY SMS
// ============================================================
const resendEmergencyNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const emergency = await EmergencyRequest.findById(id).populate("patient");

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    const patientUser = emergency.patient;
    const contact =
      req.body.emergencyContact ||
      emergency.emergencyContact ||
      patientUser?.emergencyContact;

    if (!contact || !contact.phone) {
      return res.status(400).json({
        message: "No emergency contact phone registered for this emergency",
      });
    }

    let hospitalName = "";
    if (emergency.hospital) {
      try {
        const hosp = await Hospital.findById(emergency.hospital);
        if (hosp) hospitalName = hosp.name;
      } catch (_) {}
    }

    const smsResult = await sendEmergencySms({
      patientUser,
      emergency,
      emergencyContact: contact,
      hospitalName,
      coordinates: emergency.patientLocation?.coordinates,
    });

    // Update emergency record
    emergency.emergencyContact = contact;
    emergency.smsNotification = {
      sent: smsResult.sent || false,
      status: smsResult.status || "not_sent",
      phone: smsResult.phone || contact.phone,
      recipientName: smsResult.recipientName || contact.name,
      messageSid: smsResult.messageSid || null,
      sentAt: smsResult.sentAt || new Date(),
      error: smsResult.error || null,
    };
    await emergency.save();

    res.status(200).json({
      message: smsResult.simulated
        ? "Emergency SMS simulated successfully in server console"
        : `Emergency SMS dispatched to ${smsResult.phone}`,
      smsNotification: emergency.smsNotification,
    });
  } catch (error) {
    console.error("RESEND EMERGENCY SMS ERROR:", error);
    res.status(500).json({
      message: "Failed to resend emergency SMS",
      error: error.message,
    });
  }
};

// ============================================================
// GET NOTIFICATION HISTORY FOR PATIENT
// ============================================================
const getNotificationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const notifications = await Notification.find({ patient: patientId })
      .populate("emergency", "emergencyType status requestedAt")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("GET NOTIFICATION HISTORY ERROR:", error);
    res.status(500).json({
      message: "Failed to retrieve notification history",
      error: error.message,
    });
  }
};

// ============================================================
// GET SMS CONFIGURATION STATUS
// ============================================================
const getSmsConfigStatus = async (req, res) => {
  try {
    const configured = isTwilioConfigured();
    const phone = process.env.TWILIO_PHONE_NUMBER || "";

    // Mask phone number for security, e.g. +1***...
    const maskedPhone =
      phone.length > 5
        ? phone.slice(0, 3) + "******" + phone.slice(-3)
        : phone ? "Configured" : "Not Set";

    res.status(200).json({
      configured,
      provider: configured ? "twilio" : "simulated",
      senderNumber: maskedPhone,
      defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || "+91",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get SMS status",
      error: error.message,
    });
  }
};

module.exports = {
  sendTestNotification,
  resendEmergencyNotification,
  getNotificationHistory,
  getSmsConfigStatus,
};
