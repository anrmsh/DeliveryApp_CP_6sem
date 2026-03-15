import axiosClient from "./axiosClient";

export const getUsers = async (params) => {
  const res = await axiosClient.get("/admin/users", { params });
  return res.data;
};

export const createEmployee = async (data) => {
  const res = await axiosClient.post("/admin/users", data);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axiosClient.put(`/admin/users/${id}`, data);
  return res.data;
};

export const blockUser = async (id, block) => {
  const res = await axiosClient.patch(`/admin/users/${id}/block?block=${block}`);
  return res.data;
};

export const deleteEmployee = async (id) => {
  await axiosClient.delete(`/admin/users/${id}`);
};