import api from "./api";

// Create emergency request
export const createEmergency = async (emergencyData) => {
  const response = await api.post("/emergencies", emergencyData);
  return response.data;
};

// Get all emergencies with optional filters (?patient=&hospital=&driver=&status=)
export const getAllEmergencies = async (params = {}) => {
  const response = await api.get("/emergencies", { params });
  return response.data;
};

// Get emergency by ID
export const getEmergencyById = async (id) => {
  const response = await api.get(`/emergencies/${id}`);
  return response.data;
};

// Update emergency status
export const updateEmergencyStatus = async (id, status, extra = {}) => {
  const response = await api.put(`/emergencies/${id}/status`, {
    status,
    ...extra,
  });
  return response.data;
};

// Assign ambulance to emergency
export const assignAmbulance = async (id, ambulanceId) => {
  const response = await api.put(`/emergencies/${id}/assign-ambulance`, {
    ambulanceId,
  });
  return response.data;
};

// Cancel emergency request
export const cancelEmergency = async (id) => {
  const response = await api.put(`/emergencies/${id}/cancel`);
  return response.data;
};
