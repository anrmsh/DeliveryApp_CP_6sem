import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/ClientDashboard.css";

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)",  dot: "#2563eb" },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", dot: "#7c3aed" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)",  dot: "#d97706" },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  dot: "#16a34a" },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  dot: "#dc2626" },
};

function fmtDate(val) {
  if (!val) return "—";
  const normalized = typeof val === "string" && !val.endsWith("Z") && !val.includes("+")
    ? val + "Z" : val;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU");
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)", dot: "#6b7280" };
  return (
    <span className="cd-badge" style={{ color: m.color, background: m.bg }}>
      <span className="cd-badge-dot" style={{ background: m.dot }} />
      {status}
    </span>
  );
}

function timeAgo(val) {
  if (!val) return "";
  const normalized = typeof val === "string" && !val.endsWith("Z") ? val + "Z" : val;
  const diff = (Date.now() - new Date(normalized)) / 1000;
  if (diff < 60)    return "только что";
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return fmtDate(val);
}

export default function ClientDashboard() {
  const [orders,   setOrders]   = useState([]);
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAll,  setShowAll]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getOrders().catch(() => []),
      axiosClient.get("/client/notifications").then(r => {
        const list = Array.isArray(r.data) ? r.data : r.data?.content || [];
        return list.slice(0, 5);
      }).catch(() => []),
    ]).then(([ords, nots]) => {
      setOrders(Array.isArray(ords) ? ords : ords.content || []);
      setNotifs(nots);
    }).finally(() => setLoading(false));
  }, []);

  const activeOrders  = orders.filter(o => ["Создан","Назначен","В процессе"].includes(o.status));
  const displayOrders = showAll
    ? [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
    : [...activeOrders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const total     = orders.length;
  const active    = activeOrders.length;
  const delivered = orders.filter(o => o.status === "Доставлен").length;
  const unread    = notifs.filter(n => n.statusNotification === 0).length;

  return (
    <ClientLayout>
      <div className="cd-root">

        {/* Hero */}
        <div className="cd-hero">
          <div>
            <h1 className="cd-title">Добро пожаловать!</h1>
            <p className="cd-sub">
              {new Date().toLocaleDateString("ru-RU", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <button className="cd-new-btn" onClick={() => navigate("/client/create")}>
            <i className="bx bx-plus" /> Новый заказ
          </button>
        </div>

        {/* Stats */}
        <div className="cd-stats">
          {[
            { icon:"bx-package",      num:total,     label:"Всего заказов", cls:"cd-s-blue"  },
            { icon:"bxs-truck",       num:active,    label:"В пути сейчас", cls:"cd-s-amber" },
            { icon:"bx-check-circle", num:delivered, label:"Доставлено",    cls:"cd-s-green" },
          ].map(c => (
            <div key={c.label} className={`cd-stat-card ${c.cls}`}>
              <i className={`bx ${c.icon} cd-stat-icon`} />
              <div className="cd-stat-num">{loading ? "—" : c.num}</div>
              <div className="cd-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="cd-grid">

          {/* Orders panel */}
          <div className="cd-panel">
            <div className="cd-panel-head">
              <span className="cd-panel-title">
                {showAll ? "Все заказы" : "Активные заказы"}
                {active > 0 && !showAll && <span className="cd-active-count">{active}</span>}
              </span>
              <div className="cd-panel-head-right">
                <button className="cd-toggle-link" onClick={() => setShowAll(s => !s)}>
                  {showAll ? "Только активные" : "Показать все"}
                </button>
                <button className="cd-panel-link" onClick={() => navigate("/client/orders")}>
                  Все <i className="bx bx-chevron-right" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="cd-skels">{[1,2,3].map(i => <div key={i} className="cd-skel" />)}</div>
            ) : displayOrders.length === 0 ? (
              <div className="cd-empty">
                <i className="bx bx-package" />
                <p>{showAll ? "У вас пока нет заказов" : "Нет активных заказов"}</p>
                {!showAll
                  ? <button className="cd-link-btn" onClick={() => setShowAll(true)}>Показать историю</button>
                  : <button className="cd-new-btn" onClick={() => navigate("/client/create")}>Создать заказ</button>
                }
              </div>
            ) : (
              <div className="cd-order-list">
                {displayOrders.map(o => (
                  <div key={o.id} className="cd-order-row"
                    onClick={() => navigate(`/client/orders/${o.id}`)}>
                    <div className="cd-order-icon"><i className="bx bx-package" /></div>
                    <div className="cd-order-info">
                      <div className="cd-order-id">
                        Заказ #{o.id}
                        <span className="cd-order-date">{fmtDate(o.createdAt)}</span>
                      </div>
                      <div className="cd-order-addr">{o.deliveryAddress}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cd-right-col">
            {/* Notifications */}
            <div className="cd-panel">
              <div className="cd-panel-head">
                <span className="cd-panel-title">
                  Уведомления
                  {unread > 0 && <span className="cd-notif-badge">{unread}</span>}
                </span>
                <button className="cd-panel-link" onClick={() => navigate("/client/notifications")}>
                  Все <i className="bx bx-chevron-right" />
                </button>
              </div>
              {loading ? (
                <div className="cd-skels">{[1,2].map(i => <div key={i} className="cd-skel cd-skel--sm" />)}</div>
              ) : notifs.length === 0 ? (
                <div className="cd-notif-empty">
                  <i className="bx bx-bell-off" />
                  <p>Нет уведомлений</p>
                </div>
              ) : (
                <div className="cd-notif-list">
                  {notifs.map(n => (
                    <div key={n.id} className={`cd-notif-item ${n.statusNotification === 0 ? "cd-notif-item--unread" : ""}`}
                      onClick={() => navigate("/client/notifications")}>
                      <div className="cd-notif-dot-wrap">
                        {n.statusNotification === 0 && <span className="cd-notif-dot" />}
                        <i className="bx bx-bell cd-notif-icon" />
                      </div>
                      <div className="cd-notif-body">
                        <div className="cd-notif-title">{n.title}</div>
                        <div className="cd-notif-time">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="cd-panel">
              <div className="cd-panel-head">
                <span className="cd-panel-title">Действия</span>
              </div>
              <div className="cd-quick-grid">
                {[
                  { icon:"bx-package",    label:"Новый заказ",  path:"/client/create"      },
                  { icon:"bx-calculator", label:"Калькулятор",  path:"/client/calculator"  },
                  { icon:"bx-map-alt",    label:"Отслеживание", path:"/client/track"       },
                  { icon:"bx-list-ul",    label:"История",      path:"/client/orders"      },
                  { icon: "bx-calculator", label: "Калькулятор", path: "/client/calculator" },
                ].map(a => (
                  <button key={a.label} className="cd-quick-btn" onClick={() => navigate(a.path)}>
                    <i className={`bx ${a.icon} cd-quick-icon`} />
                    <span className="cd-quick-label">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}