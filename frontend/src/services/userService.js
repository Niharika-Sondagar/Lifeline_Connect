import api from "./api";

export const getAllUsers = async (role) => {
  const params = {};
  if (role && role !== "all") {
    params.role = role;
  }
  const response = await api.get("/users", { params });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};
