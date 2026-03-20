
// ═══════════════════════════════════════════════════════════════════
// LogistRoutes.jsx  —  src/pages/logist/LogistRoutes.jsx
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistRoutes.css";

const ROUTE_STATUS_META = {
  "Запланирован": { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
  "Активен":      { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "Завершён":     { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "Отменён":      { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};

export default function LogistRoutes() {
  const [routes,  setRoutes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await axiosClient.get("/logist/routes");
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changeStatus = async (id, status) => {
    try {
      await axiosClient.patch(`/logist/routes/${id}/status`, { status });
      load();
    } catch {}
  };

  const optimize = async (id) => {
    try {
      await axiosClient.post(`/logist/routes/${id}/optimize`);
      load();
    } catch {}
  };

  return (
    <LogistLayout>
      <div className="lgr-root">
        <div className="lgr-hero">
          <div>
            <h1 className="lgr-title">Маршруты</h1>
            <p className="lgr-sub">Управление маршрутными листами</p>
          </div>
          <button className="lgr-new-btn" onClick={() => navigate("/logist/routes/new")}>
            <i className="bx bx-plus" /> Новый маршрут
          </button>
        </div>

        {loading ? (
          <div className="lgr-skels">
            {[1,2,3].map(i => <div key={i} className="lgr-skel" />)}
          </div>
        ) : routes.length === 0 ? (
          <div className="lgr-empty">
            <i className="bx bx-map" />
            <p>Маршрутов пока нет</p>
            <button className="lgr-new-btn" onClick={() => navigate("/logist/routes/new")}>
              Создать первый
            </button>
          </div>
        ) : (
          <div className="lgr-list">
            {routes.map(r => {
              const m = ROUTE_STATUS_META[r.status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
              return (
                <div key={r.id} className="lgr-card">
                  <div className="lgr-card-top">
                    <div className="lgr-card-id">
                      <i className="bx bx-map-alt" /> Маршрут #{r.id}
                    </div>
                    <span className="lgr-badge" style={{ color: m.color, background: m.bg }}>
                      {r.status}
                    </span>
                  </div>

                  <div className="lgr-card-info">
                    <div className="lgr-info-row">
                      <i className="bx bx-user" />
                      <span>{r.courierName || "—"}</span>
                    </div>
                    <div className="lgr-info-row">
                      <i className="bx bxs-truck" />
                      <span>{r.vehicleModel || "—"} {r.vehiclePlate ? `(${r.vehiclePlate})` : ""}</span>
                    </div>
                    {r.plannedStart && (
                      <div className="lgr-info-row">
                        <i className="bx bx-time" />
                        <span>{new Date(r.plannedStart).toLocaleString("ru-RU")}</span>
                      </div>
                    )}
                    {r.points && r.points.length > 0 && (
                      <div className="lgr-info-row">
                        <i className="bx bx-list-ul" />
                        <span>{r.points.length} точек доставки</span>
                      </div>
                    )}
                  </div>

                  {/* Route points */}
                  {r.points && r.points.length > 0 && (
                    <div className="lgr-points">
                      {r.points.slice(0, 4).map((p, i) => (
                        <div key={p.id} className="lgr-point">
                          <span className="lgr-point-num">{p.sequenceNumber}</span>
                          <span className="lgr-point-addr">{p.address}</span>
                          <span className={`lgr-point-status lgr-ps-${p.status?.replace(/\s/g,"")}`}>
                            {p.status}
                          </span>
                        </div>
                      ))}
                      {r.points.length > 4 && (
                        <div className="lgr-points-more">+{r.points.length - 4} ещё</div>
                      )}
                    </div>
                  )}

                  <div className="lgr-card-actions">
                    {r.status === "Запланирован" && (
                      <>
                        <button className="lgr-btn lgr-btn--optimize" onClick={() => optimize(r.id)}>
                          <i className="bx bx-refresh" /> Оптимизировать
                        </button>
                        <button className="lgr-btn lgr-btn--start"
                          onClick={() => changeStatus(r.id, "Активен")}>
                          <i className="bx bx-play" /> Запустить
                        </button>
                      </>
                    )}
                    {r.status === "Активен" && (
                      <button className="lgr-btn lgr-btn--done"
                        onClick={() => changeStatus(r.id, "Завершён")}>
                        <i className="bx bx-check" /> Завершить
                      </button>
                    )}
                    {(r.status === "Запланирован" || r.status === "Активен") && (
                      <button className="lgr-btn lgr-btn--cancel"
                        onClick={() => changeStatus(r.id, "Отменён")}>
                        <i className="bx bx-x" /> Отменить
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}