import api from "./api";

/**
 * Send a test SMS to verify that the emergency contact number receives messages.
 * @param {Object} data - { phone, name, relation, patientId }
 */
export const sendTestSms = async (data) => {
  const response = await api.post("/sms/test", data);
  return response.data;
};

/**
 * Resend emergency SMS alert for an existing emergency request.
 * @param {string} emergencyId
 * @param {Object} data - optional override { emergencyContact }
 */
export const resendEmergencySms = async (emergencyId, data = {}) => {
  const response = await api.post(`/sms/resend/${emergencyId}`, data);
  return response.data;
};

/**
 * Fetch SMS notification history for a patient.
 * @param {string} patientId
 */
export const getPatientNotificationHistory = async (patientId) => {
  const response = await api.get(`/sms/history/${patientId}`);
  return response.data;
};

/**
 * Get system SMS configuration status (whether Twilio is live or simulated).
 */
export const getSmsConfigStatus = async () => {
  const response = await api.get("/sms/config-status");
  return response.data;
};
