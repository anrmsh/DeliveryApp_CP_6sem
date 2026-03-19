import axiosClient from "./axiosClient";

export const getOrders = async () => {
  const res = await axiosClient.get("/client/orders");
  return res.data;
};

export const getOrder = async (id) => {
  const res = await axiosClient.get(`/client/orders/${id}`);
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

/* ── External free APIs (no auth) ── */

/**
 * OSRM — open-source routing, no key required.
 * Returns distance in metres and duration in seconds between two coordinates.
 */
export const getRouteInfo = async (fromCoords, toCoords) => {
  // fromCoords / toCoords: { lat, lng }
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}` +
    `?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes && data.routes.length > 0) {
    return {
      distanceKm: data.routes[0].distance / 1000,
      durationMin: data.routes[0].duration / 60,
    };
  }
  throw new Error("No route found");
};

/**
 * Open-Meteo — free weather API, no key required.
 * Returns current temperature and wind speed for a coordinate.
 */
export const getWeather = async (lat, lng) => {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current_weather=true`;
  const res = await fetch(url);
  const data = await res.json();
  return data.current_weather; // { temperature, windspeed, weathercode }
};

/**
 * Nominatim (OpenStreetMap) — geocoding, no key required.
 * Converts address string → { lat, lon }
 */
export const geocodeAddress = async (address) => {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "ru" } });
  const data = await res.json();
  if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
};