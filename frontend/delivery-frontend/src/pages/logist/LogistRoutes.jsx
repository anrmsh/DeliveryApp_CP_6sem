import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistRoutes.css";

const ROUTE_STATUS_META = {
  "Запланирован": { color: "#2563eb", bg: "rgba(37,99,235,0.1)", dot: "#2563eb" },
  "Активен":      { color: "#d97706", bg: "rgba(217,119,6,0.1)", dot: "#d97706" },
  "Завершён":     { color: "#16a34a", bg: "rgba(22,163,74,0.1)", dot: "#16a34a" },
  "Отменён":      { color: "#dc2626", bg: "rgba(220,38,38,0.1)", dot: "#dc2626" },
};

const POINT_STATUS_META = {
  "Ожидается": { icon: "bx-time-five",    color: "#6b7280" },
  "Посещена":  { icon: "bx-check-circle", color: "#16a34a" },
  "Пропущена": { icon: "bx-x-circle",     color: "#dc2626" },
};

function fmtDateTime(val) {
  if (!val) return "—";
  const normalized = typeof val === "string" && !val.endsWith("Z") && !val.includes("+")
    ? val + "Z" : val;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU");
}

function RouteTimeline({ points }) {
  if (!points || points.length === 0) return (
    <div className="lgr-no-points"><i className="bx bx-map" /> Нет точек доставки</div>
  );
  const done = points.filter(p => p.status === "Посещена").length;
  const pct  = Math.round((done / points.length) * 100);
  return (
    <div className="lgr-timeline">
      <div className="lgr-progress-wrap">
        <div className="lgr-progress-bar">
          <div className="lgr-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="lgr-progress-label">{done}/{points.length} точек</span>
      </div>
      <div className="lgr-dots-row">
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <div key={p.id} className="lgr-dot-wrap">
              {!isLast && (
                <div className={`lgr-dot-line ${p.status === "Посещена" ? "lgr-dot-line--done" : ""}`} />
              )}
              <div
                className={`lgr-dot lgr-dot--${p.status === "Посещена" ? "done" : p.status === "Пропущена" ? "skip" : "wait"}`}
                title={`${p.sequenceNumber}. ${p.address}`}
              >
                {p.status === "Посещена"  && <i className="bx bx-check" />}
                {p.status === "Пропущена" && <i className="bx bx-x" />}
                {p.status === "Ожидается" && <span>{p.sequenceNumber}</span>}
              </div>
              <div className="lgr-dot-addr">{p.address?.split(",")[0]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── RouteCard — navigate объявлен внутри компонента ── */
function RouteCard({ route, onApprove, onReject, approving }) {
  const navigate = useNavigate(); // ← теперь здесь

  const m       = ROUTE_STATUS_META[route.status] || ROUTE_STATUS_META["Запланирован"];
  const isDraft = route.status === "Запланирован";

  return (
    <div className={`lgr-card ${isDraft ? "lgr-card--draft" : ""}`}>

      {/* Header */}
      <div className="lgr-card-top">
        <div className="lgr-card-id">
          <i className="bx bx-map-alt" /> Маршрут #{route.id}
          {isDraft && <span className="lgr-draft-badge">Ожидает утверждения</span>}
        </div>
        <span className="lgr-badge" style={{ color: m.color, background: m.bg }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background: m.dot, display:"inline-block", marginRight:5 }} />
          {route.status}
        </span>
      </div>

      {/* Info */}
      <div className="lgr-card-info">
        <div className="lgr-info-item">
          <i className="bx bx-user" />
          <span>{route.courierName || "—"}</span>
        </div>
        <div className="lgr-info-item">
          <i className="bx bxs-truck" />
          <span>{route.vehicleModel || "—"} {route.vehiclePlate ? `· ${route.vehiclePlate}` : ""}</span>
        </div>
        {route.plannedStart && (
          <div className="lgr-info-item">
            <i className="bx bx-time" />
            <span>{fmtDateTime(route.plannedStart)}</span>
          </div>
        )}
        {route.actualDistanceKm && (
          <div className="lgr-info-item">
            <i className="bx bx-trip" />
            <span>{route.actualDistanceKm} км</span>
          </div>
        )}
      </div>

      <RouteTimeline points={route.points} />

      {/* Actions */}
      <div className="lgr-card-actions">
        {/* Подробнее — всегда */}
        <button
          className="lgr-btn lgr-btn--detail"
          onClick={() => navigate(`/logist/routes/${route.id}`)}
        >
          <i className="bx bx-show" /> Подробнее
        </button>

        {/* Утвердить / Отклонить — только черновики */}
        {isDraft && (
          <>
            <button
              className="lgr-btn lgr-btn--approve"
              onClick={() => onApprove(route.id)}
              disabled={approving === route.id}
            >
              <i className="bx bx-check-circle" />
              {approving === route.id ? "Утверждаем..." : "Утвердить"}
            </button>
            <button className="lgr-btn lgr-btn--reject" onClick={() => onReject(route.id)}>
              <i className="bx bx-x-circle" /> Отклонить
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LogistRoutes() {
  const [routes,    setRoutes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [planning,  setPlanning]  = useState(false);
  const [approving, setApproving] = useState(null);
  const [filter,    setFilter]    = useState("Все");
  const [planMsg,   setPlanMsg]   = useState("");

  const load = async () => {
    try {
      const res = await axiosClient.get("/logist/routes");
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAutoplan = async () => {
    setPlanning(true); setPlanMsg("");
    try {
      const res = await axiosClient.post("/logist/autoplan");
      const created = Array.isArray(res.data) ? res.data.length : 0;
      setPlanMsg(created > 0
        ? `Система создала ${created} маршрут${created === 1 ? "" : created < 5 ? "а" : "ов"}. Проверьте и утвердите.`
        : "Нет необработанных заказов или свободных ресурсов.");
      await load();
    } catch { setPlanMsg("Ошибка при планировании"); }
    finally  { setPlanning(false); }
  };

  const handleApprove = async (id) => {
    setApproving(id);
    try { await axiosClient.post(`/logist/routes/${id}/approve`); await load(); }
    catch {}
    finally { setApproving(null); }
  };

  const handleReject = async (id) => {
    try { await axiosClient.post(`/logist/routes/${id}/reject`); await load(); }
    catch {}
  };

  const FILTERS  = ["Все", "Запланирован", "Активен", "Завершён", "Отменён"];
  const filtered = filter === "Все" ? routes : routes.filter(r => r.status === filter);
  const drafts   = routes.filter(r => r.status === "Запланирован").length;

  return (
    <LogistLayout>
      <div className="lgr-root">

        <div className="lgr-hero">
          <div>
            <h1 className="lgr-title">Маршруты</h1>
            <p className="lgr-sub">Автоматическое планирование и утверждение маршрутных листов</p>
          </div>
          <button className="lgr-autoplan-btn" onClick={handleAutoplan} disabled={planning}>
            <i className={`bx ${planning ? "bx-loader-alt lgr-spin" : "bx-chip"}`} />
            {planning ? "Планируем..." : "Запустить автопланирование"}
          </button>
        </div>

        {planMsg && (
          <div className={`lgr-plan-msg ${planMsg.includes("Ошибка") ? "lgr-plan-msg--err" : "lgr-plan-msg--ok"}`}>
            <i className={`bx ${planMsg.includes("Ошибка") ? "bx-error-circle" : "bx-info-circle"}`} />
            {planMsg}
          </div>
        )}

        {drafts > 0 && (
          <div className="lgr-drafts-banner">
            <i className="bx bx-bell" />
            <span><strong>{drafts}</strong> маршрут{drafts === 1 ? "" : drafts < 5 ? "а" : "ов"} ожидают вашего утверждения</span>
          </div>
        )}

        <div className="lgr-filters">
          {FILTERS.map(f => (
            <button key={f}
              className={`lgr-filter ${filter === f ? "lgr-filter--active" : ""}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="lgr-skels">{[1,2,3].map(i => <div key={i} className="lgr-skel" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="lgr-empty">
            <i className="bx bx-map" />
            <p>{filter !== "Все" ? `Нет маршрутов со статусом "${filter}"` : "Маршрутов пока нет"}</p>
            <span>Нажмите «Запустить автопланирование» чтобы система создала маршруты</span>
          </div>
        ) : (
          <div className="lgr-list">
            {filtered.map(r => (
              <RouteCard
                key={r.id}
                route={r}
                onApprove={handleApprove}
                onReject={handleReject}
                approving={approving}
              />
            ))}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}