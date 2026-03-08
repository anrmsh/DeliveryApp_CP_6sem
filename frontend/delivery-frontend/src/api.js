const API_URL = "http://localhost:8080/api";

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const registerUser = async (data) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getOAuthUrl = async (provider) => {
  const res = await fetch(`${API_URL}/auth/oauth2/login`);
  const data = await res.json();
  return provider === "google" ? data.redirectUrl : data.redirectUrl; // можно расширить
};