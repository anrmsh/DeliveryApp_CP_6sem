import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import "../../styles/client/OrderList.css";

const STATUS_META = {
  "Создан": { color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  "Назначен": { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  "Доставлен": { color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  "Отменён": { color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

const FILTERS = ["Все", "Создан", "Назначен", "В процессе", "Доставлен", "Отменён"];

function normalizeDate(val) {
  if (!val) return null;
  const normalized = typeof val === "string" && !val.endsWith("Z") && !val.includes("+") ? `${val}Z` : val;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDate(val) {
  const d = normalizeDate(val);
  return d ? d.toLocaleDateString("ru-RU") : "—";
}

function fmtDateTime(val) {
  const d = normalizeDate(val);
  return d ? d.toLocaleString("ru-RU") : "—";
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return <span className="ol-badge" style={{ color: meta.color, background: meta.bg }}>{status}</span>;
}

function OrderModal({ order, onClose, onDetail }) {
  if (!order) return null;
  const meta = STATUS_META[order.status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  const isActive = ["Назначен", "В процессе"].includes(order.status);

  return (
    <div className="ol-modal-overlay" onClick={onClose}>
      <div className="ol-modal" onClick={(e) => e.stopPropagation()}>
        <button className="ol-modal-close" onClick={onClose}><i className="bx bx-x" /></button>

        <div className="ol-modal-header">
          <div className="ol-modal-id">Заказ #{order.id}</div>
          <span className="ol-modal-badge" style={{ color: meta.color, background: meta.bg }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, display: "inline-block", marginRight: 5 }} />
            {order.status}
          </span>
        </div>

        <div className="ol-modal-route">
          <div className="ol-modal-route-row">
            <div className="ol-modal-dot ol-modal-dot--from">A</div>
            <div>
              <div className="ol-modal-route-label">Откуда</div>
              <div className="ol-modal-route-addr">{order.pickupAddress}</div>
            </div>
          </div>
          <div className="ol-modal-vline" />
          <div className="ol-modal-route-row">
            <div className="ol-modal-dot ol-modal-dot--to">Б</div>
            <div>
              <div className="ol-modal-route-label">Куда</div>
              <div className="ol-modal-route-addr">{order.deliveryAddress}</div>
            </div>
          </div>
        </div>

        <div className="ol-modal-meta">
          <div className="ol-modal-meta-row">
            <span><i className="bx bx-calendar" /> Создан</span>
            <strong>{fmtDate(order.createdAt)}</strong>
          </div>
          {order.requestedTime && (
            <div className="ol-modal-meta-row">
              <span><i className="bx bx-time" /> Желаемое время</span>
              <strong>{fmtDateTime(order.requestedTime)}</strong>
            </div>
          )}
          {order.courierName && (
            <div className="ol-modal-meta-row">
              <span><i className="bx bx-user" /> Курьер</span>
              <strong>{order.courierName}</strong>
            </div>
          )}
        </div>

        <div className="ol-modal-actions">
          {isActive && (
            <button className="ol-modal-btn ol-modal-btn--track" onClick={() => { onClose(); onDetail(order.id); }}>
              <i className="bx bx-map-alt" /> Отследить
            </button>
          )}
          <button className="ol-modal-btn ol-modal-btn--detail" onClick={() => { onClose(); onDetail(order.id); }}>
            <i className="bx bx-show" /> Подробная карточка
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : data.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((order) => {
    const matchFilter = filter === "Все" || order.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || String(order.id).includes(q)
      || order.pickupAddress?.toLowerCase().includes(q)
      || order.deliveryAddress?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <ClientLayout>
      <div className="ol-root">
        <div className="ol-hero">
          <div>
            <h1 className="ol-title">Мои заказы</h1>
            <p className="ol-sub">{orders.length} заказов всего</p>
          </div>
          <button className="ol-new-btn" onClick={() => navigate("/client/create")}>+ Новый заказ</button>
        </div>

        <div className="ol-toolbar">
          <input className="ol-search" placeholder="Поиск по адресу или номеру..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="ol-filters">
            {FILTERS.map((item) => (
              <button key={item} className={`ol-filter-btn ${filter === item ? "ol-filter-btn--active" : ""}`} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="ol-skels">{[1, 2, 3, 4].map((i) => <div key={i} className="ol-skel" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="ol-empty">
            <i className="bx bx-package" />
            <p>{search || filter !== "Все" ? "Совпадений не найдено" : "У вас пока нет заказов"}</p>
            {!search && filter === "Все" && (
              <button className="ol-new-btn" onClick={() => navigate("/client/create")}>Создать первый заказ</button>
            )}
          </div>
        ) : (
          <div className="ol-list">
            {filtered.map((order) => (
              <div key={order.id} className="ol-card" onClick={() => setSelected(order)}>
                <div className="ol-card-left">
                  <div className="ol-card-id">Заказ #{order.id}</div>
                  <div className="ol-card-route">
                    <div className="ol-addr">
                      <span className="ol-addr-dot ol-addr-dot--from" />
                      <span>{order.pickupAddress}</span>
                    </div>
                    <div className="ol-addr-line" />
                    <div className="ol-addr">
                      <span className="ol-addr-dot ol-addr-dot--to" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="ol-card-right">
                  <StatusBadge status={order.status} />
                  <div className="ol-card-date">{fmtDate(order.createdAt)}</div>
                  <i className="bx bx-chevron-right ol-card-arrow" />
                </div>
              </div>
            ))}
          </div>
        )}

        <OrderModal order={selected} onClose={() => setSelected(null)} onDetail={(id) => navigate(`/client/orders/${id}`)} />
      </div>
    </ClientLayout>
  );
}
