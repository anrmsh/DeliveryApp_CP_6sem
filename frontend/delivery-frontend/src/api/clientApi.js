import axiosClient from "./axiosClient";

export const getOrders = async () => {
  const res = await axiosClient.get("/client/orders");
  return res.data;
};

export const createOrder = async (data) => {
  const res = await axiosClient.post("/client/orders", data);
  return res.data;
};

export const calculatePrice = async (data) => {
  const res = await axiosClient.post("/client/calculate", data);
  return res.data;
};

export const rateCourier = async (data) => {
  const res = await axiosClient.post("/client/rating", data);
  return res.data;
};