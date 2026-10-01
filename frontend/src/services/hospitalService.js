import api from "./api";

// Get all registered hospitals
export const getAllHospitals = async () => {
  const response = await api.get("/hospitals");
  return response.data;
};

// Get hospital profile
export const getHospitalProfile = async (id) => {
  const response = await api.get(`/hospitals/profile/${id}`);
  return response.data;
};

// Update hospital profile
export const updateHospitalProfile = async (id, data) => {
  const response = await api.put(`/hospitals/profile/${id}`, data);
  return response.data;
};

// Get emergency requests received by hospital
export const getHospitalEmergencies = async (hospitalId) => {
  const response = await api.get(`/hospitals/emergencies`, {
    params: { hospitalId },
  });
  return response.data;
};
