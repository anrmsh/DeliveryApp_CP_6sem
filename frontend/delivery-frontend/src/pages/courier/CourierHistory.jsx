// ═══════════════════════════════════════════════════════════════════
// CourierHistory.jsx  —  src/pages/courier/CourierHistory.jsx
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import CourierLayout from "../../components/layout/CourierLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/courier/CourierHistory.css";

export default function CourierHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get("/courier/routes/history")
      .then(r => setHistory(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalKm = history.reduce((sum, r) => sum + (r.actualDistanceKm || 0), 0);
  const totalRoutes = history.length;

  return (
    <CourierLayout>
      <div className="ch-root">
        <div className="ch-hero">
          <h1 className="ch-title">История маршрутов</h1>
          <p className="ch-sub">Ваши завершённые рейсы</p>
        </div>

        {/* Summary */}
        {!loading && history.length > 0 && (
          <div className="ch-summary">
            <div className="ch-sum-card">
              <i className="bx bx-map-alt"/>
              <div className="ch-sum-num">{totalRoutes}</div>
              <div className="ch-sum-label">Маршрутов</div>
            </div>
            <div className="ch-sum-card">
              <i className="bx bx-trip"/>
              <div className="ch-sum-num">{Math.round(totalKm * 10) / 10}</div>
              <div className="ch-sum-label">Км всего</div>
            </div>
            <div className="ch-sum-card">
              <i className="bx bx-package"/>
              <div className="ch-sum-num">{history.reduce((s,r) => s + r.visitedPoints, 0)}</div>
              <div className="ch-sum-label">Доставлено</div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="ch-skels">{[1,2,3].map(i => <div key={i} className="ch-skel"/>)}</div>
        ) : history.length === 0 ? (
          <div className="ch-empty">
            <i className="bx bx-history"/>
            <p>Завершённых маршрутов пока нет</p>
          </div>
        ) : (
          <div className="ch-list">
            {history.map((r, i) => {
              const pct = r.totalPoints > 0
                ? Math.round((r.visitedPoints / r.totalPoints) * 100) : 0;
              return (
                <div key={r.id} className="ch-card">
                  <div className="ch-card-top">
                    <div className="ch-card-id">
                      <i className="bx bx-map-alt"/> Маршрут #{r.id}
                    </div>
                    <span className="ch-done-badge">
                      <i className="bx bx-check-circle"/> Завершён
                    </span>
                  </div>

                  <div className="ch-card-meta">
                    {r.vehicleModel && (
                      <div className="ch-meta-row">
                        <i className="bx bxs-truck"/> {r.vehicleModel} · {r.vehiclePlate}
                      </div>
                    )}
                    {r.plannedStart && (
                      <div className="ch-meta-row">
                        <i className="bx bx-calendar"/>
                        {new Date(r.plannedStart).toLocaleDateString("ru-RU", {
                          day:"numeric", month:"long", year:"numeric",
                        })}
                      </div>
                    )}
                    {r.actualDistanceKm && (
                      <div className="ch-meta-row">
                        <i className="bx bx-trip"/> {r.actualDistanceKm} км
                      </div>
                    )}
                  </div>

                  {/* Delivery progress */}
                  <div className="ch-pts-row">
                    <span>{r.visitedPoints}/{r.totalPoints} доставлено ({pct}%)</span>
                  </div>
                  <div className="ch-bar">
                    <div className="ch-bar-fill" style={{width:`${pct}%`}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CourierLayout>
  );
}


