const express = require("express");
const {
  sendTestNotification,
  resendEmergencyNotification,
  getNotificationHistory,
  getSmsConfigStatus,
} = require("../Controllers/smsController");

const router = express.Router();

// Get SMS configuration status (is Twilio active or simulated)
router.get("/config-status", getSmsConfigStatus);

// Send test SMS to check emergency contact phone
router.post("/test", sendTestNotification);

// Resend emergency SMS for an emergency request
router.post("/resend/:id", resendEmergencyNotification);

// Get notification history for a patient
router.get("/history/:patientId", getNotificationHistory);

module.exports = router;
