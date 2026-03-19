import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import "../../styles/client/OrderList.css";

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};

const FILTERS = ["Все", "Создан", "Назначен", "В процессе", "Доставлен", "Отменён"];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span className="ol-badge" style={{ color: m.color, background: m.bg }}>
      {status}
    </span>
  );
}

export default function OrdersList() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("Все");
  const [search,  setSearch]  = useState("");
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

  const filtered = orders.filter(o => {
    const matchFilter = filter === "Все" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(o.id).includes(q) ||
      o.pickupAddress?.toLowerCase().includes(q) ||
      o.deliveryAddress?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <ClientLayout>
      <div className="ol-root">
        <div className="ol-hero">
          <div>
            <h1 className="ol-title">История заказов</h1>
            <p className="ol-sub">{orders.length} заказов всего</p>
          </div>
          <button className="ol-new-btn" onClick={() => navigate("/client/create")}>
            + Новый заказ
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="ol-toolbar">
          <input
            className="ol-search"
            placeholder="🔍  Поиск по адресу или номеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="ol-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`ol-filter-btn ${filter === f ? "ol-filter-btn--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="ol-skels">
            {[1,2,3,4].map(i => <div key={i} className="ol-skel" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="ol-empty">
            <span>📭</span>
            <p>{search || filter !== "Все" ? "Нет совпадений" : "У вас пока нет заказов"}</p>
            {!search && filter === "Все" && (
              <button className="ol-new-btn" onClick={() => navigate("/client/create")}>
                Создать первый заказ
              </button>
            )}
          </div>
        ) : (
          <div className="ol-list">
            {filtered.map(o => (
              <div
                key={o.id}
                className="ol-card"
                onClick={() => navigate(`/client/orders/${o.id}`)}
              >
                <div className="ol-card-left">
                  <div className="ol-card-id">Заказ #{o.id}</div>
                  <div className="ol-card-route">
                    <div className="ol-addr">
                      <span className="ol-addr-dot ol-addr-dot--from" />
                      <span>{o.pickupAddress}</span>
                    </div>
                    <div className="ol-addr-line" />
                    <div className="ol-addr">
                      <span className="ol-addr-dot ol-addr-dot--to" />
                      <span>{o.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
                <div className="ol-card-right">
                  <StatusBadge status={o.status} />
                  <div className="ol-card-date">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString("ru-RU") : "—"}
                  </div>
                  <button className="ol-details-btn">Подробнее →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}