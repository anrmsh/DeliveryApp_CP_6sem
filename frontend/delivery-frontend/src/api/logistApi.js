import axiosClient from "./axiosClient";

export const getDashboard = () => axiosClient.get("/logist/dashboard").then(r => r.data);

export const getLogistOrders = () => axiosClient.get("/logist/orders").then(r => r.data);

export const getRoutes = () => axiosClient.get("/logist/routes").then(r => r.data);

export const getRoute = (id) => axiosClient.get(`/logist/routes/${id}`).then(r => r.data);

export const createRoute = (data) => axiosClient.post("/logist/routes", data).then(r => r.data);

export const updateRouteStatus = (id, status) =>
    axiosClient.patch(`/logist/routes/${id}/status`, { status }).then(r => r.data);

export const assignOrder = (routeId, orderId) =>
    axiosClient.post(`/logist/routes/${routeId}/orders/${orderId}`).then(r => r.data);

export const optimizeRoute = (id) => axiosClient.post(`/logist/routes/${id}/optimize`).then(r => r.data);

export const getVehicles = (params) => axiosClient.get("/logist/vehicles", { params }).then(r => r.data);

export const getCouriers = () => axiosClient.get("/logist/couriers").then(r => r.data);

export const getCourierRatings = () => axiosClient.get("/logist/couriers/ratings").then(r => r.data);

export const getReport = (period) => axiosClient.get(`/logist/reports?period=${period}`).then(r => r.data);
