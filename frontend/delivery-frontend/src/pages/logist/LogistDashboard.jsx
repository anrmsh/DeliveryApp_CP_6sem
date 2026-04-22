import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDate, timeAgo } from "../../utils/dateUtils";
import "../../styles/logist/LogistDashboard.css";

function NotifIcon({ title }) {
  const t = (title || "").toLowerCase();
  if (t.includes("завершил") || t.includes("завершён"))
    return <i className="bx bx-check-circle lgd-notif-icon lgd-notif-icon--green"/>;
  if (t.includes("начал") || t.includes("активен"))
    return <i className="bx bxs-truck lgd-notif-icon lgd-notif-icon--amber"/>;
  if (t.includes("новый заказ") || t.includes("заявк"))
    return <i className="bx bx-package lgd-notif-icon lgd-notif-icon--blue"/>;
  if (t.includes("отмен"))
    return <i className="bx bx-x-circle lgd-notif-icon lgd-notif-icon--red"/>;
  return <i className="bx bx-bell lgd-notif-icon lgd-notif-icon--muted"/>;
}

export default function LogistDashboard() {
  const [stats,   setStats]   = useState(null);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axiosClient.get("/logist/dashboard").then(r => r.data).catch(() => null),
      axiosClient.get("/logist/notifications")
        .then(r => (Array.isArray(r.data) ? r.data : r.data?.content || []).slice(0, 8))
        .catch(() => []),
    ]).then(([s, n]) => { setStats(s); setNotifs(n); })
      .finally(() => setLoading(false));
  }, []);

  const markRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, statusNotification: 1 } : n));
    axiosClient.patch(`/logist/notifications/${id}/read`).catch(() => {});
  };

  const markAll = () => {
    setNotifs(prev => prev.map(n => ({ ...n, statusNotification: 1 })));
    axiosClient.patch("/logist/notifications/read-all").catch(() => {});
  };

  const unread = notifs.filter(n => n.statusNotification === 0).length;

  const CARDS = stats ? [
    { icon:"bx-package",          label:"Всего заказов",       num:stats.totalOrders,   cls:"lgd-blue",   path:"/logist/orders"   },
    { icon:"bx-time",             label:"Ожидают назначения",  num:stats.pendingOrders, cls:"lgd-amber",  path:"/logist/orders"   },
    { icon:"bx-map-alt",          label:"Активных маршрутов",  num:stats.activeRoutes,  cls:"lgd-green",  path:"/logist/routes"   },
    { icon:"bxs-truck",           label:"Свободных авто",      num:stats.freeVehicles,  cls:"lgd-indigo", path:"/logist/vehicles" },
    { icon:"bx-group",            label:"Курьеров",            num:stats.totalCouriers, cls:"lgd-teal",   path:"/logist/couriers" },
  ] : [];

  return (
    <LogistLayout>
      <div className="lgd-root">

        <div className="lgd-hero">
          <div>
            <h1 className="lgd-title">Панель логиста</h1>
            <p className="lgd-sub">
              {new Date().toLocaleDateString("ru-RU", {
                weekday:"long", day:"numeric", month:"long", year:"numeric",
              })}
            </p>
          </div>
          <button className="lgd-create-btn" onClick={() => navigate("/logist/routes")}>
            <i className="bx bx-map-alt"/> Маршруты
          </button>
        </div>

        <div className="lgd-cards">
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="lgd-skel"/>)
            : CARDS.map(c => (
              <div key={c.label} className={`lgd-card ${c.cls}`} onClick={() => navigate(c.path)}>
                <i className={`bx ${c.icon} lgd-card-icon`}/>
                <div className="lgd-card-num">{c.num ?? "—"}</div>
                <div className="lgd-card-label">{c.label}</div>
              </div>
            ))
          }
        </div>

        <div className="lgd-main-grid">

          {/* Notifications */}
          <div className="lgd-panel">
            <div className="lgd-panel-head">
              <span className="lgd-panel-title">
                Уведомления
                {unread > 0 && <span className="lgd-notif-badge">{unread}</span>}
              </span>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                {unread > 0 && (
                  <button className="lgd-panel-link" onClick={markAll}>
                    <i className="bx bx-check-double"/> Прочитать все
                  </button>
                )}
                <button className="lgd-panel-link" onClick={() => navigate("/logist/notifications")}>
                  Все <i className="bx bx-chevron-right"/>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="lgd-notif-skels">{[1,2,3].map(i => <div key={i} className="lgd-nskel"/>)}</div>
            ) : notifs.length === 0 ? (
              <div className="lgd-notif-empty">
                <i className="bx bx-bell-off"/>
                <p>Нет уведомлений</p>
              </div>
            ) : (
              <div className="lgd-notif-list">
                {notifs.map(n => (
                  <div key={n.id}
                    className={`lgd-notif-item ${n.statusNotification === 0 ? "lgd-notif-item--unread" : ""}`}
                    onClick={() => markRead(n.id)}>
                    <NotifIcon title={n.title}/>
                    <div className="lgd-notif-body">
                      <div className="lgd-notif-title">{n.title}</div>
                      <div className="lgd-notif-msg">{n.message}</div>
                      <div className="lgd-notif-time">{timeAgo(n.createdAt)}</div>
                    </div>
                    {n.statusNotification === 0 && <span className="lgd-unread-dot"/>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="lgd-panel">
            <div className="lgd-panel-head">
              <span className="lgd-panel-title">Быстрые действия</span>
            </div>
            <div className="lgd-actions">
              {[
                { icon:"bx-chip",            label:"Автопланирование", path:"/logist/routes",    accent:true },
                { icon:"bx-package",         label:"Заказы",           path:"/logist/orders"          },
                { icon:"bxs-truck",          label:"Автопарк",         path:"/logist/vehicles"        },
                { icon:"bx-star",            label:"Рейтинг",          path:"/logist/couriers"        },
                { icon:"bx-bar-chart-alt-2", label:"Отчёты",           path:"/logist/reports"         },
                { icon:"bx-receipt",         label:"Чеки",             path:"/logist/routes"          },
              ].map(a => (
                <button key={a.label}
                  className={`lgd-action-btn ${a.accent ? "lgd-action-btn--accent" : ""}`}
                  onClick={() => navigate(a.path)}>
                  <i className={`bx ${a.icon}`}/>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </LogistLayout>
  );
}