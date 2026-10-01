import api from "./api";

export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

export const getPatientProfile = async (id) => {
  const response = await api.get(`/patients/profile/${id}`);
  return response.data;
};

export const updatePatientProfile = async (id, data) => {
  const response = await api.put(`/patients/profile/${id}`, data);
  return response.data;
};
