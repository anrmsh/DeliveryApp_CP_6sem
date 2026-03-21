import axiosClient from "./axiosClient";

export const getDashboard = () => axiosClient.get("/courier/dashboard").then(r => r.data);

export const getCurrentRoute = () => axiosClient.get("/courier/route/current").then(r => r.data);

export const updatePointStatus = (id, status) =>
    axiosClient.patch(`/courier/route/points/${id}/status`, { status }).then(r => r.data);

export const completeRoute = (id, km) =>
    axiosClient.post(`/courier/route/${id}/complete`, { actualDistanceKm: km }).then(r => r.data);

export const getNotifications = () => axiosClient.get("/courier/notifications").then(r => r.data);

export const markRead = (id) => axiosClient.patch(`/courier/notifications/${id}/read`);

export const markAllRead = () => axiosClient.patch("/courier/notifications/read-all");

export const getHistory = () => axiosClient.get("/courier/routes/history").then(r => r.data);

export const getProfile = () => axiosClient.get("/courier/profile").then(r => r.data);