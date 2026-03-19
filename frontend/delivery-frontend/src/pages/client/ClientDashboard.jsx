import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import "../../styles/client/ClientDashboard.css";

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)",  dot: "#2563eb" },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", dot: "#7c3aed" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)",  dot: "#d97706" },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  dot: "#16a34a" },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  dot: "#dc2626" },
};

function getStatusMeta(s) {
  return STATUS_META[s] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)", dot: "#6b7280" };
}

function StatusBadge({ status }) {
  const m = getStatusMeta(status);
  return (
    <span className="cd-badge" style={{ color: m.color, background: m.bg }}>
      <span className="cd-badge-dot" style={{ background: m.dot }} />
      {status}
    </span>
  );
}

export default function ClientDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrders();
        setOrders(Array.isArray(data) ? data : data.content || []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const total     = orders.length;
  const active    = orders.filter(o => ["Назначен","В процессе"].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === "Доставлен").length;
  const recent    = [...orders].reverse().slice(0, 5);

  return (
    <ClientLayout>
      <div className="cd-root">

        {/* HERO */}
        <div className="cd-hero">
          <div>
            <h1 className="cd-title">Личный кабинет</h1>
            <p className="cd-sub">Управляйте заказами и отслеживайте доставки</p>
          </div>
          <button className="cd-new-btn" onClick={() => navigate("/client/create")}>
            + Новый заказ
          </button>
        </div>

        {/* STATS */}
        <div className="cd-stats">
          {[
            { icon: "📦", num: total,     label: "Всего заказов",   cls: "cd-s-blue"  },
            { icon: "🚚", num: active,    label: "В пути сейчас",   cls: "cd-s-amber" },
            { icon: "✅", num: delivered, label: "Доставлено",      cls: "cd-s-green" },
          ].map(c => (
            <div key={c.label} className={`cd-stat-card ${c.cls}`}>
              <span className="cd-stat-icon">{c.icon}</span>
              <div className="cd-stat-num">{loading ? "—" : c.num}</div>
              <div className="cd-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="cd-grid">

          {/* Recent orders */}
          <div className="cd-panel">
            <div className="cd-panel-head">
              <span className="cd-panel-title">Последние заказы</span>
              <button className="cd-panel-link" onClick={() => navigate("/client/orders")}>
                Все →
              </button>
            </div>
            {loading ? (
              <div className="cd-skels">
                {[1,2,3].map(i => <div key={i} className="cd-skel" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="cd-empty">
                <span>📭</span>
                <p>У вас пока нет заказов</p>
                <button className="cd-new-btn" onClick={() => navigate("/client/create")}>
                  Создать первый
                </button>
              </div>
            ) : (
              <div className="cd-order-list">
                {recent.map(o => (
                  <div
                    key={o.id}
                    className="cd-order-row"
                    onClick={() => navigate(`/client/orders/${o.id}`)}
                  >
                    <div className="cd-order-icon">📦</div>
                    <div className="cd-order-info">
                      <div className="cd-order-id">Заказ #{o.id}</div>
                      <div className="cd-order-addr">{o.deliveryAddress}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="cd-panel">
            <div className="cd-panel-head">
              <span className="cd-panel-title">Быстрые действия</span>
            </div>
            <div className="cd-quick-grid">
              {[
                { icon: "📦", label: "Новый заказ",     path: "/client/create"        },
                { icon: "📑", label: "История",          path: "/client/orders"        },
                { icon: "📍", label: "Отслеживание",     path: "/client/track"         },
                { icon: "🔔", label: "Уведомления",      path: "/client/notifications" },
              ].map(a => (
                <button key={a.label} className="cd-quick-btn" onClick={() => navigate(a.path)}>
                  <span className="cd-quick-icon">{a.icon}</span>
                  <span className="cd-quick-label">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Calculator promo */}
            <div className="cd-calc-promo">
              <div className="cd-calc-promo-content">
                <span className="cd-calc-promo-icon">🧮</span>
                <div>
                  <div className="cd-calc-promo-title">Рассчитайте стоимость</div>
                  <div className="cd-calc-promo-sub">С учётом пробок и погоды</div>
                </div>
              </div>
              <button
                className="cd-calc-promo-btn"
                onClick={() => navigate("/client/create")}
              >
                Рассчитать
              </button>
            </div>
          </div>

        </div>
      </div>
    </ClientLayout>
  );
}