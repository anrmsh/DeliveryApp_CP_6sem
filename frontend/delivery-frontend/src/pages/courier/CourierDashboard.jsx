import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourierLayout from "../../components/layout/CourierLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/courier/CourierDashboard.css";

export default function CourierDashboard() {
  const [dash,    setDash]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get("/courier/dashboard")
      .then(r => setDash(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = dash ? [
    { icon: "bx-map-alt",       label: "Маршрутов всего",  num: dash.totalRoutes,    cls: "cdb-green",  path: "/courier/history" },
    { icon: "bx-check-circle",  label: "Завершено",        num: dash.completedRoutes,cls: "cdb-emerald", path: "/courier/history" },
    { icon: "bx-trip",          label: "Км пройдено",      num: `${dash.totalKm} км`,cls: "cdb-teal",   path: null },
    { icon: "bx-star",          label: "Рейтинг",          num: dash.averageRating > 0 ? dash.averageRating.toFixed(1) : "—", cls: "cdb-lime", path: null },
  ] : [];

  return (
    <CourierLayout>
      <div className="cdb-root">

        {/* Hero */}
        <div className="cdb-hero">
          <div>
            <h1 className="cdb-title">Привет, водитель!</h1>
            <p className="cdb-sub">
              {new Date().toLocaleDateString("ru-RU", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
            </p>
          </div>
          {dash?.activeRoutes > 0 && (
            <button className="cdb-active-btn" onClick={() => navigate("/courier/route")}>
              <i className="bx bx-radio-circle-marked cdb-pulse" /> Активный маршрут
            </button>
          )}
        </div>

        {/* Notifications banner */}
        {dash?.unreadNotifications > 0 && (
          <div className="cdb-notif-banner" onClick={() => navigate("/courier/profile")}>
            <i className="bx bx-bell" />
            <span>У вас <strong>{dash.unreadNotifications}</strong> новых уведомлений</span>
            <i className="bx bx-chevron-right" />
          </div>
        )}

        {/* Stat cards */}
        <div className="cdb-cards">
          {loading
            ? [1,2,3,4].map(i => <div key={i} className="cdb-skel"/>)
            : cards.map(c => (
              <div key={c.label} className={`cdb-card ${c.cls}`}
                onClick={() => c.path && navigate(c.path)}
                style={{ cursor: c.path ? "pointer" : "default" }}>
                <i className={`bx ${c.icon} cdb-card-icon`}/>
                <div className="cdb-card-num">{c.num}</div>
                <div className="cdb-card-label">{c.label}</div>
              </div>
            ))
          }
        </div>

        {/* Rating stars */}
        {dash && dash.totalRatings > 0 && (
          <div className="cdb-rating-card">
            <div className="cdb-section-title">
              <i className="bx bx-star"/> Ваш рейтинг
            </div>
            <div className="cdb-stars-row">
              {[1,2,3,4,5].map(i => (
                <i key={i} className={`bx ${i <= Math.round(dash.averageRating) ? "bxs-star" : "bx-star"} cdb-star`}/>
              ))}
              <span className="cdb-star-num">{dash.averageRating.toFixed(1)}</span>
              <span className="cdb-star-total">({dash.totalRatings} отзывов)</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="cdb-section-title"><i className="bx bx-bolt-circle"/> Действия</div>
        <div className="cdb-actions">
          {[
            { icon: "bx-map-alt",   label: "Мой маршрут",  path: "/courier/route"   },
            { icon: "bx-history",   label: "История",       path: "/courier/history" },
            { icon: "bx-user",      label: "Профиль",       path: "/courier/profile" },
          ].map(a => (
            <button key={a.label} className="cdb-action-btn" onClick={() => navigate(a.path)}>
              <i className={`bx ${a.icon}`}/>
              <span>{a.label}</span>
            </button>
          ))}
        </div>

      </div>
    </CourierLayout>
  );
}