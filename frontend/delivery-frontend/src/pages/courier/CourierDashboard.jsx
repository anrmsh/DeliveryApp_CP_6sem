import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourierLayout from "../../components/layout/CourierLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/courier/CourierDashboard.css";

const FALLBACK_COORDS = { latitude: 53.9, longitude: 27.5667 };

function buildTrafficLabel(date) {
  const hour = date.getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return { label: "Высокая", hint: "час пик", tone: "danger" };
  }
  if ((hour >= 10 && hour <= 16) || (hour >= 20 && hour <= 21)) {
    return { label: "Средняя", hint: "движение стабильное", tone: "warn" };
  }
  return { label: "Низкая", hint: "дороги свободнее обычного", tone: "safe" };
}

function buildWeatherLabel(data) {
  if (!data) return { label: "Нет данных", value: "--" };
  const code = data.weathercode;
  const weatherMap = {
    0: "Ясно",
    1: "Преимущественно ясно",
    2: "Переменная облачность",
    3: "Пасмурно",
    45: "Туман",
    48: "Изморозь",
    51: "Морось",
    61: "Дождь",
    71: "Снег",
    95: "Гроза",
  };
  return {
    label: weatherMap[code] || "Погодные условия",
    value: `${Math.round(data.temperature)}°C`,
  };
}

export default function CourierDashboard() {
  const [dash, setDash] = useState(null);
  const [route, setRoute] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      axiosClient.get("/courier/dashboard").then((r) => r.data).catch(() => null),
      axiosClient.get("/courier/route/current").then((r) => r.data).catch(() => null),
    ])
      .then(([dashboard, currentRoute]) => {
        if (!mounted) return;
        setDash(dashboard);
        setRoute(currentRoute);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const point = route?.points?.find((item) => item.latitude && item.longitude);
    const coords = point || FALLBACK_COORDS;

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weathercode&timezone=auto`)
      .then((res) => res.json())
      .then((data) => setWeather(buildWeatherLabel(data?.current)))
      .catch(() => setWeather(null));
  }, [route]);

  const activePoints = route?.points?.filter((point) => point.status !== "Посещена").length || 0;
  const traffic = buildTrafficLabel(now);
  const infoCards = [
    {
      icon: "bx-time-five",
      label: "Дата и время",
      value: now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      hint: now.toLocaleDateString("ru-RU", { weekday: "long" }),
      tone: "neutral",
    },
    {
      icon: "bx-cloud",
      label: "Погода",
      // value: weather?.value || "--",
      value: "12 *C",
      hint: weather?.label || "Данные обновляются",
      tone: "sky",
    },
    {
      icon: "bx-line-chart",
      label: "Загруженность дорог",
      value: traffic.label,
      hint: traffic.hint,
      tone: traffic.tone,
    },
    {
      icon: "bx-map-pin",
      label: "Активные точки",
      value: activePoints,
      hint: dash?.activeRoutes > 0 ? `Маршрутов в работе: ${dash.activeRoutes}` : "Нет активного маршрута",
      tone: "leaf",
    },
  ];

  const stats = dash ? [
    { icon: "bx-map-alt", label: "Маршрутов всего", num: dash.totalRoutes, path: "/courier/history" },
    { icon: "bx-check-circle", label: "Завершено", num: dash.completedRoutes, path: "/courier/history" },
    { icon: "bx-trip", label: "Пробег", num: `${dash.totalKm} км`, path: null },
    { icon: "bx-star", label: "Рейтинг", num: dash.averageRating > 0 ? dash.averageRating.toFixed(1) : "—", path: null },
  ] : [];

  return (
    <CourierLayout>
      <div className="cdb-root">
        <section className="cdb-hero">
          <div>
            <p className="cdb-overline">Панель курьера</p>
            <h1 className="cdb-title">Сводка по смене</h1>
            <p className="cdb-sub">Актуальная обстановка по дороге, погоде и текущему маршрутному листу.</p>
          </div>
          <div className="cdb-hero-actions">
            <button className="cdb-active-btn" onClick={() => navigate("/courier/route")}>
              <i className="bx bx-navigation" /> Маршрутный лист
            </button>
          </div>
        </section>

        <section className="cdb-info-grid">
          {infoCards.map((card) => (
            <article key={card.label} className={`cdb-info-card cdb-info-card--${card.tone}`}>
              <div className="cdb-info-top">
                <i className={`bx ${card.icon}`} />
                <span>{card.label}</span>
              </div>
              <div className="cdb-info-value">{card.value}</div>
              <div className="cdb-info-hint">{card.hint}</div>
            </article>
          ))}
        </section>

        {dash?.unreadNotifications > 0 && (
          <div className="cdb-notif-banner" onClick={() => navigate("/courier/profile")}>
            <i className="bx bx-bell" />
            <span>Новых уведомлений: <strong>{dash.unreadNotifications}</strong></span>
            <i className="bx bx-chevron-right" />
          </div>
        )}

        <section className="cdb-cards">
          {loading
            ? [1, 2, 3, 4].map((i) => <div key={i} className="cdb-skel" />)
            : stats.map((item) => (
                <div
                  key={item.label}
                  className="cdb-card"
                  onClick={() => item.path && navigate(item.path)}
                  style={{ cursor: item.path ? "pointer" : "default" }}
                >
                  <i className={`bx ${item.icon} cdb-card-icon`} />
                  <div className="cdb-card-num">{item.num}</div>
                  <div className="cdb-card-label">{item.label}</div>
                </div>
              ))}
        </section>

        <section className="cdb-panel-row">
          <div className="cdb-panel">
            <div className="cdb-section-title"><i className="bx bx-current-location" /> Текущий маршрут</div>
            {route ? (
              <>
                <div className="cdb-route-line"><strong>Маршрут #{route.id}</strong></div>
                <div className="cdb-route-line">Точек в листе: {route.points?.length || 0}</div>
                <div className="cdb-route-line">Осталось обслужить: {activePoints}</div>
                <button className="cdb-panel-btn" onClick={() => navigate("/courier/route")}>Открыть маршрут</button>
              </>
            ) : (
              <div className="cdb-empty-state">Активный маршрут пока не назначен.</div>
            )}
          </div>

          <div className="cdb-panel">
            <div className="cdb-section-title"><i className="bx bx-bolt-circle" /> Быстрые действия</div>
            <div className="cdb-actions">
              {[
                { icon: "bx-map-alt", label: "Маршрут", path: "/courier/route" },
                { icon: "bx-history", label: "История", path: "/courier/history" },
                { icon: "bx-user", label: "Профиль", path: "/courier/profile" },
              ].map((a) => (
                <button key={a.label} className="cdb-action-btn" onClick={() => navigate(a.path)}>
                  <i className={`bx ${a.icon}`} />
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </CourierLayout>
  );
}

