import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDate, fmtDateTime } from "../../utils/dateUtils";
import "../../styles/logist/LogistOrders.css";

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)"   },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)"  },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)"   },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)"   },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)"   },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  return (
    <span className="lgo-badge" style={{ color: m.color, background: m.bg }}>
      {status}
    </span>
  );
}

export default function LogistOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("Все");
  const [search,  setSearch]  = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/logist/orders");
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const FILTERS = ["Все", "Создан", "Назначен", "В процессе", "Доставлен", "Отменён"];

  const filtered = orders.filter(o => {
    const matchStatus = filter === "Все" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || String(o.id).includes(q)
      || o.deliveryAddress?.toLowerCase().includes(q)
      || o.clientName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <LogistLayout>
      <div className="lgo-root">
        <div className="lgo-hero">
          <div>
            <h1 className="lgo-title">Заказы</h1>
            <p className="lgo-sub">Заказы ожидающие назначения на маршрут</p>
          </div>
          <button className="lgo-route-btn" onClick={() => navigate("/logist/routes/new")}>
            <i className="bx bx-map-alt" /> Создать маршрут
          </button>
        </div>

        <div className="lgo-toolbar">
          <input
            className="lgo-search"
            placeholder="Поиск по адресу, клиенту, номеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="lgo-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`lgo-filter ${filter === f ? "lgo-filter--active" : ""}`}
                onClick={() => setFilter(f)}
              >{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="lgo-skels">
            {[1,2,3].map(i => <div key={i} className="lgo-skel" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="lgo-empty">
            <i className="bx bx-package" />
            <p>Заказов не найдено</p>
          </div>
        ) : (
          <div className="lgo-list">
            {filtered.map(o => (
              <div key={o.id} className="lgo-card">
                <div className="lgo-card-left">
                  <div className="lgo-card-id">
                    <i className="bx bx-hash" /> {o.id}
                  </div>
                  <div className="lgo-card-route">
                    <div className="lgo-addr">
                      <span className="lgo-dot lgo-dot--from" />
                      {o.pickupAddress}
                    </div>
                    <div className="lgo-addr-line" />
                    <div className="lgo-addr">
                      <span className="lgo-dot lgo-dot--to" />
                      {o.deliveryAddress}
                    </div>
                  </div>
                  {o.clientName && (
                    <div className="lgo-client">
                      <i className="bx bx-user" /> {o.clientName}
                    </div>
                  )}
                </div>
                <div className="lgo-card-right">
                  <StatusBadge status={o.status} />
                  <div className="lgo-date">
                    <i className="bx bx-calendar" />
                    {fmtDate(o.createdAt)}
                  </div>
                  {o.requestedTime && (
                    <div className="lgo-requested">
                      <i className="bx bx-time" />
                      {fmtDateTime(o.requestedTime)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}

