// src/utils/dateUtils.js
// Безопасное форматирование дат из Spring LocalDateTime

function normalize(val) {
  if (!val) return null;
  const s = typeof val === "string" && !val.endsWith("Z") && !val.includes("+")
    ? val + "Z" : val;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtDate(val) {
  const d = normalize(val);
  if (!d) return "—";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function fmtDateShort(val) {
  const d = normalize(val);
  if (!d) return "—";
  return d.toLocaleDateString("ru-RU");
}

export function fmtDateTime(val) {
  const d = normalize(val);
  if (!d) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtTime(val) {
  const d = normalize(val);
  if (!d) return "—";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateForDoc(val) {
  const d = normalize(val);
  if (!d) return "«___» ________ 20__ г.";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function toSpringISO(val) {
  if (!val) return null;
  return val.length === 16 ? val + ":00" : val;
}

export function timeAgo(val) {
  const d = normalize(val);
  if (!d) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)     return "только что";
  if (diff < 3600)   return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
  return fmtDateShort(val);
}