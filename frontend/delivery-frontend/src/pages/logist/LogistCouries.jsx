import { useEffect, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDateTime } from "../../utils/dateUtils";
import "../../styles/logist/LogistCouriers.css";

function Stars({ value }) {
  return (
    <span className="lc-stars">
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`bx ${i <= Math.round(value || 0) ? "bxs-star" : "bx-star"}`}/>
      ))}
    </span>
  );
}

function CourierModal({ courier, onClose }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient.get(`/logist/couriers/${courier.courierId}/ratings`)
      .then(r => setRatings(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRatings([]))
      .finally(() => setLoading(false));
  }, [courier.courierId]);

  const isActive = courier.courierStatus === "Активен";

  return (
    <div className="lc-overlay" onClick={onClose}>
      <div className="lc-modal" onClick={e => e.stopPropagation()}>
        <button className="lc-modal-close" onClick={onClose}><i className="bx bx-x"/></button>

        <div className="lc-modal-header">
          <div className="lc-modal-avatar">
            {(courier.courierName || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()}
          </div>
          <div>
            <div className="lc-modal-name">{courier.courierName}</div>
            <div className="lc-modal-meta">
              {courier.courierPhone && (
                <a href={`tel:${courier.courierPhone}`} className="lc-modal-phone">
                  <i className="bx bx-phone"/> {courier.courierPhone}
                </a>
              )}
              {courier.courierEmail && (
                <span><i className="bx bx-envelope"/> {courier.courierEmail}</span>
              )}
            </div>
            <span className={`lc-status-badge ${isActive ? "lc-status-badge--active" : ""}`}>
              <span className="lc-status-dot"/> {courier.courierStatus || "—"}
            </span>
          </div>
        </div>

        <div className="lc-modal-stats">
          {[
            { label:"Маршрутов",  val: courier.completedRoutes  || 0 },
            { label:"Доставок",   val: courier.totalDeliveries  || 0 },
            { label:"Ср. оценка", val: courier.averageRating > 0 ? courier.averageRating.toFixed(1) : "—" },
            { label:"Отзывов",    val: courier.totalRatings     || 0 },
          ].map(s => (
            <div key={s.label} className="lc-modal-stat">
              <div className="lc-modal-stat-num">{s.val}</div>
              <div className="lc-modal-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="lc-ratings-title">
          <i className="bx bx-star"/> Отзывы клиентов
        </div>

        {loading ? (
          <div className="lc-ratings-loading"><div className="lc-spin"/></div>
        ) : ratings.length === 0 ? (
          <div className="lc-ratings-empty">Отзывов пока нет</div>
        ) : (
          <div className="lc-ratings-list">
            {ratings.map((r, idx) => (
              <div key={r.id || idx} className="lc-rating-card">
                <div className="lc-rating-top">
                  <Stars value={r.rating}/>
                  <span className="lc-rating-num">{r.rating}/5</span>
                  <span className="lc-rating-date">{fmtDateTime(r.createdAt)}</span>
                </div>
                {r.clientName && (
                  <div className="lc-rating-client"><i className="bx bx-user"/> {r.clientName}</div>
                )}
                {r.orderId && (
                  <div className="lc-rating-order">Заказ #{r.orderId}</div>
                )}
                {r.comment && (
                  <div className="lc-rating-comment">
                    <i className="bx bx-comment-detail"/> {r.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogistCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosClient.get("/logist/couriers/ratings")
      .then(r => setCouriers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <LogistLayout>
      <div className="lc-root">
        <div className="lc-hero">
          <h1 className="lc-title">Курьеры</h1>
          <p className="lc-sub">Рейтинг и отзывы клиентов</p>
        </div>

        {loading ? (
          <div className="lc-skels">{[1,2,3,4].map(i => <div key={i} className="lc-skel"/>)}</div>
        ) : couriers.length === 0 ? (
          <div className="lc-empty"><i className="bx bx-group"/><p>Нет данных о курьерах</p></div>
        ) : (
          <div className="lc-grid">
            {couriers.map(c => {
              const isActive = c.courierStatus === "Активен";
              return (
                <div key={c.courierId} className="lc-card" onClick={() => setSelected(c)}>
                  <div className="lc-card-top">
                    <div className="lc-avatar">
                      {(c.courierName || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()}
                    </div>
                    <span className={`lc-card-status ${isActive ? "lc-card-status--active" : ""}`}>
                      <span className="lc-status-dot"/> {c.courierStatus || "—"}
                    </span>
                  </div>
                  <div className="lc-card-name">{c.courierName}</div>
                  {c.courierPhone && (
                    <div className="lc-card-phone"><i className="bx bx-phone"/> {c.courierPhone}</div>
                  )}
                  <div className="lc-card-rating">
                    <Stars value={c.averageRating}/>
                    <span>{c.averageRating > 0 ? c.averageRating.toFixed(1) : "—"}</span>
                    <span className="lc-card-total">({c.totalRatings} отз.)</span>
                  </div>
                  <div className="lc-card-stats">
                    <div><span>{c.completedRoutes || 0}</span> маршрутов</div>
                    <div><span>{c.totalDeliveries || 0}</span> доставок</div>
                  </div>
                  <button className="lc-card-btn" onClick={() => setSelected(c)}>
                    <i className="bx bx-show"/> Подробнее
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selected && <CourierModal courier={selected} onClose={() => setSelected(null)}/>}
      </div>
    </LogistLayout>
  );
}