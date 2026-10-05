const twilio = require("twilio");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/**
 * Clean and format phone number into E.164 international format.
 * Defaults to Indian country code (+91) if 10-digit number is provided.
 */
function formatPhoneNumber(phone, defaultCountryCode) {
  if (!phone) return "";

  const countryCode = (
    defaultCountryCode ||
    process.env.DEFAULT_COUNTRY_CODE ||
    "+91"
  ).trim();
  const prefix = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;

  let cleaned = String(phone).trim().replace(/[^\d+]/g, "");

  // If already starts with +
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, "");

  // If starts with 0 and total 11 digits (Indian trunk prefix, e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${prefix}${digits.slice(1)}`;
  }

  // 10 digits mobile number (standard Indian phone number)
  if (digits.length === 10) {
    return `${prefix}${digits}`;
  }

  // 12 digits starting with 91 (India)
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // 11 digits starting with 1 (US / Canada)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Check if real Twilio credentials are configured in environment
 */
function isTwilioConfigured() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !fromNumber) {
    return false;
  }

  // Check for placeholder or dummy values
  const dummyValues = [
    "your_twilio_account_sid",
    "your_twilio_auth_token",
    "your_twilio_phone_number",
    "acxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  ];

  if (
    dummyValues.some(
      (dummy) =>
        sid.toLowerCase().includes(dummy) ||
        token.toLowerCase().includes(dummy) ||
        fromNumber.toLowerCase().includes(dummy),
    )
  ) {
    return false;
  }

  return sid.trim().length > 10 && token.trim().length > 10;
}

/**
 * Initialize Twilio client
 */
function getTwilioClient() {
  if (!isTwilioConfigured()) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Helper to safely log notifications to DB only when MongoDB connection is active
 */
async function logNotificationToDb(data) {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      return await Notification.create(data);
    } catch (err) {
      console.error("Could not save notification log to DB:", err.message);
    }
  }
  return null;
}

/**
 * Build emergency SMS alert text
 */
function buildEmergencyMessage({
  patientName,
  patientPhone,
  emergencyType,
  description,
  coordinates,
  hospitalName,
  contactName,
  relation,
}) {
  let mapsLink = "";
  if (
    coordinates &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    (coordinates[0] !== 0 || coordinates[1] !== 0)
  ) {
    // GeoJSON is [longitude, latitude]
    const lng = coordinates[0];
    const lat = coordinates[1];
    mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  }

  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const relationText = relation ? `Your ${relation}` : "Your contact";
  const salutation = contactName ? `Dear ${contactName},` : "URGENT:";

  let text = `🚨 LIFELINE CONNECT - EMERGENCY ALERT 🚨\n`;
  text += `${salutation}\n`;
  text += `${relationText} ${patientName || "Patient"} has dispatched an URGENT EMERGENCY REQUEST.\n\n`;
  text += `• Type: ${emergencyType || "Critical Emergency"}\n`;
  if (description) {
    text += `• Details: ${description}\n`;
  }
  if (mapsLink) {
    text += `• Live GPS: ${mapsLink}\n`;
  }
  if (hospitalName) {
    text += `• Hospital: ${hospitalName}\n`;
  }
  if (patientPhone) {
    text += `• Patient Phone: ${patientPhone}\n`;
  }
  text += `• Time: ${timeStr}\n\n`;
  text += `Emergency response teams have been alerted. Please reach out immediately!`;

  return text;
}

/**
 * Send SMS notification to patient's emergency contact
 */
async function sendEmergencySms({
  patientUser,
  emergency,
  emergencyContact,
  hospitalName = "",
  coordinates = null,
}) {
  const contact =
    emergencyContact ||
    patientUser?.emergencyContact ||
    emergency?.emergencyContact ||
    {};

  const recipientName = contact.name || "Emergency Contact";
  const rawPhone = contact.phone;
  const relation = contact.relation || "Contact";

  if (!rawPhone || !rawPhone.trim()) {
    console.warn(
      "⚠️ [SMS SERVICE] No emergency contact phone number registered for patient.",
    );
    return {
      sent: false,
      status: "skipped",
      reason: "No emergency contact phone registered for this patient",
    };
  }

  const formattedPhone = formatPhoneNumber(rawPhone);
  const locationCoords =
    coordinates || emergency?.patientLocation?.coordinates || null;

  const smsBody = buildEmergencyMessage({
    patientName: patientUser?.name || "Patient",
    patientPhone: patientUser?.phone || "",
    emergencyType: emergency?.emergencyType || "Medical Emergency",
    description: emergency?.description || "",
    coordinates: locationCoords,
    hospitalName,
    contactName: recipientName,
    relation,
  });

  // Check if Twilio is configured
  if (isTwilioConfigured()) {
    try {
      const client = getTwilioClient();
      console.log(
        `📤 [SMS SERVICE] Sending live SMS via Twilio to ${formattedPhone}...`,
      );

      const message = await client.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(
        `✅ [SMS SERVICE] Live SMS dispatched! SID: ${message.sid} to ${formattedPhone}`,
      );

      // Log notification in database
      await logNotificationToDb({
        patient: patientUser?._id || emergency?.patient || null,
        emergency: emergency?._id || null,
        recipientName,
        recipientPhone: formattedPhone,
        relation,
        type: "sms",
        message: smsBody,
        status: "sent",
        provider: "twilio",
        providerMessageId: message.sid,
      });

      return {
        sent: true,
        status: "sent",
        phone: formattedPhone,
        recipientName,
        relation,
        messageSid: message.sid,
        sentAt: new Date(),
        simulated: false,
      };
    } catch (twilioErr) {
      console.error(
        "❌ [SMS SERVICE] Twilio delivery failed:",
        twilioErr.message,
      );

      // Log failure in database
      await logNotificationToDb({
        patient: patientUser?._id || emergency?.patient || null,
        emergency: emergency?._id || null,
        recipientName,
        recipientPhone: formattedPhone,
        relation,
        type: "sms",
        message: smsBody,
        status: "failed",
        provider: "twilio",
        error: twilioErr.message,
      });

      return {
        sent: false,
        status: "failed",
        phone: formattedPhone,
        recipientName,
        relation,
        error: twilioErr.message,
        simulated: false,
      };
    }
  }

  // Fallback: Twilio credentials not provided -> Log simulation to server console
  console.log("\n" + "=".repeat(75));
  console.log("📱 [SMS SERVICE - SIMULATED EMERGENCY SMS]");
  console.log("   (Twilio credentials not set in .env. Showing simulated SMS output)");
  console.log("-".repeat(75));
  console.log(`   TO:       ${formattedPhone} (${recipientName} - ${relation})`);
  console.log(
    `   FROM:     ${process.env.TWILIO_PHONE_NUMBER || "Lifeline Connect Emergency Dispatch"}`,
  );
  console.log(`   PATIENT:  ${patientUser?.name || "Patient"}`);
  console.log("   MESSAGE:\n");
  console.log(
    smsBody
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n"),
  );
  console.log("-".repeat(75));
  console.log(
    "💡 TIP: To send real SMS messages, provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,",
  );
  console.log("        and TWILIO_PHONE_NUMBER in your .env file.");
  console.log("=".repeat(75) + "\n");

  // Save simulated notification to database for logging & history
  const savedNotif = await logNotificationToDb({
    patient: patientUser?._id || emergency?.patient || null,
    emergency: emergency?._id || null,
    recipientName,
    recipientPhone: formattedPhone,
    relation,
    type: "sms",
    message: smsBody,
    status: "simulated",
    provider: "simulated",
    providerMessageId: `sim_${Date.now()}`,
  });

  return {
    sent: true,
    status: "simulated",
    phone: formattedPhone,
    recipientName,
    relation,
    messageSid: savedNotif?.providerMessageId || `sim_${Date.now()}`,
    sentAt: new Date(),
    simulated: true,
    note: "Twilio credentials not configured in .env. Notification simulated in server logs.",
  };
}

/**
 * Send a test SMS to verify emergency contact setup
 */
async function sendTestSms({
  to,
  recipientName = "Emergency Contact",
  patientName = "Patient",
  relation = "Contact",
  patientId = null,
}) {
  if (!to || !to.trim()) {
    throw new Error("Recipient phone number is required");
  }

  const formattedPhone = formatPhoneNumber(to);
  const timeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const testMessage =
    `✅ LIFELINE CONNECT - TEST NOTIFICATION\n` +
    `Hello ${recipientName},\n` +
    `This is a test notification from Lifeline Connect. You are registered as the emergency contact (${relation}) for ${patientName}.\n` +
    `During an actual medical emergency, you will receive instant SMS alerts with GPS location at this number.\n` +
    `Time: ${timeStr}`;

  if (isTwilioConfigured()) {
    const client = getTwilioClient();
    const message = await client.messages.create({
      body: testMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    await logNotificationToDb({
      patient: patientId,
      recipientName,
      recipientPhone: formattedPhone,
      relation,
      type: "sms",
      message: testMessage,
      status: "sent",
      provider: "twilio",
      providerMessageId: message.sid,
    });

    return {
      success: true,
      status: "sent",
      phone: formattedPhone,
      messageSid: message.sid,
      simulated: false,
    };
  }

  // Simulated Test SMS
  console.log("\n" + "=".repeat(75));
  console.log("📱 [SMS SERVICE - TEST SMS SIMULATED]");
  console.log(`   TO:       ${formattedPhone} (${recipientName} - ${relation})`);
  console.log(`   MESSAGE:\n   ${testMessage.replace(/\n/g, "\n   ")}`);
  console.log("=".repeat(75) + "\n");

  await logNotificationToDb({
    patient: patientId,
    recipientName,
    recipientPhone: formattedPhone,
    relation,
    type: "sms",
    message: testMessage,
    status: "simulated",
    provider: "simulated",
    providerMessageId: `test_sim_${Date.now()}`,
  });

  return {
    success: true,
    status: "simulated",
    phone: formattedPhone,
    simulated: true,
    note: "Twilio credentials not configured in .env. Test SMS simulated in server logs.",
  };
}

module.exports = {
  formatPhoneNumber,
  isTwilioConfigured,
  sendEmergencySms,
  sendTestSms,
  buildEmergencyMessage,
};
