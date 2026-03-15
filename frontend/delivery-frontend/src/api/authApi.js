import axiosClient from "./axiosClient";

export const loginUser = async (email, password) => {

  const res = await axiosClient.post("/auth/login", {
    email,
    password
  });

  return res.data;
};

export const registerUser = async (data) => {

  const res = await axiosClient.post("/auth/register", data);

  return res.data;
};

// src/api/authApi.js
import axios from "axios";

export const logoutUser = async () => {
  try {
    // Отправляем запрос на бэкенд для выхода
    await axios.post("/api/auth/logout");
  } catch (err) {
    console.error("Ошибка выхода:", err);
    throw err;
  }
};