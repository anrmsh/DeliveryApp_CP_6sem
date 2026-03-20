// ═══════════════════════════════════════════════════════════════════
// LogistCouriers.jsx  —  src/pages/logist/LogistCouriers.jsx
// ═══════════════════════════════════════════════════════════════════
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

export default function LogistCouriers() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/logist/couriers/ratings");
        setRatings(Array.isArray(res.data) ? res.data : []);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <LogistLayout>
      <div className="lgc-root">
        <div className="lgc-hero">
          <h1 className="lgc-title">Рейтинг курьеров</h1>
          <p className="lgc-sub">Оценки на основе отзывов клиентов</p>
        </div>

        {loading ? (
          <div className="lgc-skels">
            {[1,2,3].map(i => <div key={i} className="lgc-skel" />)}
          </div>
        ) : ratings.length === 0 ? (
          <div className="lgc-empty">
            <i className="bx bx-group" />
            <p>Нет данных о курьерах</p>
          </div>
        ) : (
          <div className="lgc-list">
            {ratings.map((r, idx) => (
              <div key={r.courierId} className={`lgc-card ${idx === 0 ? "lgc-card--top" : ""}`}>
                <div className="lgc-rank">
                  {idx === 0 ? <i className="bx bxs-crown lgc-crown" /> : `#${idx + 1}`}
                </div>
                <div className="lgc-avatar">
                  {r.courierName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}
                </div>
                <div className="lgc-info">
                  <div className="lgc-name">{r.courierName}</div>
                  <div className="lgc-total">{r.totalRatings} отзывов</div>
                </div>
                <Stars rating={r.averageRating} />
              </div>
            ))}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}



