import api from "./api";

// Get all ambulances (filters: ?hospital=&driver=&status=)
export const getAllAmbulances = async (params = {}) => {
  const response = await api.get("/ambulances", { params });
  return response.data;
};

// Get ambulance details
export const getAmbulance = async (id) => {
  const response = await api.get(`/ambulances/${id}`);
  return response.data;
};

// Update ambulance status ('available', 'assigned', 'on_the_way', 'busy', 'maintenance')
export const updateAmbulanceStatus = async (id, status) => {
  const response = await api.put(`/ambulances/${id}/status`, { status });
  return response.data;
};

// Update ambulance location
export const updateAmbulanceLocation = async (id, latitude, longitude) => {
  const response = await api.put(`/ambulances/${id}/location`, {
    latitude,
    longitude,
  });
  return response.data;
};

// Create / register ambulance
export const createAmbulance = async (data) => {
  const response = await api.post("/ambulances", data);
  return response.data;
};
