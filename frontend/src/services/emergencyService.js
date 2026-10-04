import api from "./api";

export const createEmergency = async (emergencyData) => {
  const response = await api.post(
    "/emergencies",
    emergencyData
  );

  return response.data;
};

export const getAllEmergencies = async (params = {}) => {
  const response = await api.get("/emergencies", {
    params,
  });

  return response.data;
};

export const getEmergencyById = async (id) => {
  const response = await api.get(
    `/emergencies/${id}`
  );

  return response.data;
};

export const acceptAndAssignAmbulance = async (id, hospitalId = null) => {
  const response = await api.put(
    `/emergencies/${id}/accept-and-assign`,
    hospitalId ? { hospitalId } : {}
  );

  return response.data;
};

export const updateEmergencyStatus = async (
  id,
  status,
  extra = {}
) => {
  const response = await api.put(
    `/emergencies/${id}/status`,
    {
      status,
      ...extra,
    }
  );

  return response.data;
};

export const assignAmbulance = async (
  id,
  ambulanceId
) => {
  const response = await api.put(
    `/emergencies/${id}/assign-ambulance`,
    {
      ambulanceId,
    }
  );

  return response.data;
};

export const cancelEmergency = async (id) => {
  const response = await api.put(
    `/emergencies/${id}/cancel`
  );

  return response.data;
}