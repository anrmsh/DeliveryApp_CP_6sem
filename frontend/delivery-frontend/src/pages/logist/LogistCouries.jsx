import { useEffect, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistCouriers.css";

function Stars({ rating }) {
  return (
    <div className="lgc-stars">
      {[1,2,3,4,5].map(i => (
        <i key={i} className={`bx ${i <= Math.round(rating) ? "bxs-star" : "bx-star"} lgc-star`} />
      ))}
      <span className="lgc-rating-num">{rating > 0 ? rating.toFixed(1) : "—"}</span>
    </div>
  );
}

function CourierModal({ courier, onClose }) {
  if (!courier) return null;
  return (
    <div className="lgc-modal-overlay" onClick={onClose}>
      <div className="lgc-modal" onClick={e => e.stopPropagation()}>
        <button className="lgc-modal-close" onClick={onClose}>
          <i className="bx bx-x" />
        </button>
        <div className="lgc-modal-hero">
          <div className="lgc-modal-avatar">
            {courier.courierName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "?"}
          </div>
          <div className="lgc-modal-info">
            <div className="lgc-modal-name">{courier.courierName}</div>
            <div className="lgc-modal-contact">
              <i className="bx bx-envelope" /> {courier.courierEmail || "—"}
            </div>
            {courier.courierPhone && (
              <a href={`tel:${courier.courierPhone}`} className="lgc-modal-contact lgc-modal-phone">
                <i className="bx bx-phone" /> {courier.courierPhone}
              </a>
            )}
            <span className={`lgc-modal-status ${courier.courierStatus === "Активен" ? "lgc-modal-status--active" : "lgc-modal-status--blocked"}`}>
              <span className="lgc-modal-dot" /> {courier.courierStatus || "—"}
            </span>
          </div>
        </div>

        <div className="lgc-modal-stars-row">
          <Stars rating={courier.averageRating} />
          <span className="lgc-modal-ratings-count">
            {courier.totalRatings} {courier.totalRatings === 1 ? "отзыв" : courier.totalRatings < 5 ? "отзыва" : "отзывов"}
          </span>
        </div>

        <div className="lgc-modal-stats">
          {[
            { icon: "bx-map-alt",  label: "Маршрутов",  num: courier.completedRoutes  },
            { icon: "bx-package",  label: "Доставок",   num: courier.totalDeliveries  },
            { icon: "bx-star",     label: "Рейтинг",    num: courier.averageRating > 0 ? courier.averageRating.toFixed(1) : "—" },
          ].map(s => (
            <div key={s.label} className="lgc-modal-stat-card">
              <i className={`bx ${s.icon}`} />
              <div className="lgc-modal-stat-num">{s.num}</div>
              <div className="lgc-modal-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LogistCouriers() {
  const [ratings,  setRatings]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosClient.get("/logist/couriers/ratings")
      .then(r => setRatings(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <LogistLayout>
      <div className="lgc-root">
        <div className="lgc-hero">
          <h1 className="lgc-title">Рейтинг курьеров</h1>
          <p className="lgc-sub">Нажмите на карточку для подробной информации</p>
        </div>

        {loading ? (
          <div className="lgc-skels">{[1,2,3].map(i => <div key={i} className="lgc-skel"/>)}</div>
        ) : ratings.length === 0 ? (
          <div className="lgc-empty"><i className="bx bx-group" /><p>Нет данных о курьерах</p></div>
        ) : (
          <div className="lgc-list">
            {ratings.map((r, idx) => (
              <div
                key={r.courierId}
                className={`lgc-card ${idx === 0 ? "lgc-card--top" : ""}`}
                onClick={() => setSelected(r)}
              >
                <div className="lgc-rank">
                  {idx === 0 ? <i className="bx bxs-crown lgc-crown" /> : `#${idx + 1}`}
                </div>
                <div className="lgc-avatar">
                  {r.courierName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}
                </div>
                <div className="lgc-info">
                  <div className="lgc-name">{r.courierName}</div>
                  <div className="lgc-meta">
                    <span>{r.totalRatings} отзывов</span>
                    <span className="lgc-dot-sep">·</span>
                    <span>{r.completedRoutes} маршрутов</span>
                    <span className="lgc-dot-sep">·</span>
                    <span>{r.totalDeliveries} доставок</span>
                  </div>
                </div>
                <Stars rating={r.averageRating} />
                <i className="bx bx-chevron-right lgc-arrow" />
              </div>
            ))}
          </div>
        )}

        <CourierModal courier={selected} onClose={() => setSelected(null)} />
      </div>
    </LogistLayout>
  );
}