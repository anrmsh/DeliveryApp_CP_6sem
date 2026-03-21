import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrder, rateCourier, geocodeAddress } from "../../api/clientApi";
import { fmtDate, fmtDateTime, fmtTime } from "../../dateUtils";
import "../../styles/client/OrderDetail.css";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};
const STATUSES = ["Создан", "Назначен", "В процессе", "Доставлен"];
const STATUS_PCT = { "Создан": 0, "Назначен": 15, "В процессе": 55, "Доставлен": 100 };

function StarRating({ value, onChange }) {
  return (
    <div className="od-stars">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          className={`od-star ${value >= s ? "od-star--on" : ""}`}
          onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );
}

function StatusSteps({ status }) {
  const idx = STATUSES.indexOf(status);
  if (status === "Отменён") return (
    <div className="od-cancelled"><i className="bx bx-x-circle" /> Заказ отменён</div>
  );
  return (
    <div className="od-steps">
      {STATUSES.map((s, i) => (
        <div key={s} className="od-step-wrap">
          <div className={`od-step ${i<=idx?"od-step--done":""} ${i===idx?"od-step--active":""}`}>
            <div className="od-step-circle">
              {i < idx ? <i className="bx bx-check"/> : i===idx ? <span className="od-pulse"/> : <span>{i+1}</span>}
            </div>
            <div className="od-step-label">{s}</div>
          </div>
          {i < STATUSES.length-1 && (
            <div className={`od-step-line ${i<idx?"od-step-line--done":""}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Интерполяция по polyline ── */
function interpolate(coords, t) {
  if (!coords || coords.length < 2) return coords?.[0];
  if (t <= 0) return coords[0];
  if (t >= 1) return coords[coords.length-1];
  let total = 0;
  const segs = [];
  for (let i = 0; i < coords.length-1; i++) {
    const d = Math.hypot(coords[i+1][0]-coords[i][0], coords[i+1][1]-coords[i][1]);
    segs.push(d); total += d;
  }
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const r = target / segs[i];
      return [coords[i][0]+r*(coords[i+1][0]-coords[i][0]), coords[i][1]+r*(coords[i+1][1]-coords[i][1])];
    }
    target -= segs[i];
  }
  return coords[coords.length-1];
}

export default function OrderDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const mapRef       = useRef(null);
  const mapObjRef    = useRef(null);
  const carMarkerRef = useRef(null);
  const carAnimRef   = useRef(null);
  const routeCoordsRef = useRef([]);

  const [order,     setOrder]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [rating,    setRating]    = useState(0);
  const [comment,   setComment]   = useState("");
  const [rated,     setRated]     = useState(false);
  const [rateErr,   setRateErr]   = useState("");
  const [submitting,setSub]       = useState(false);
  const [mapReady,  setMapReady]  = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(data => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (document.getElementById("lf-od-css")) { setMapReady(true); return; }
    const link = document.createElement("link");
    link.id = "lf-od-css"; link.rel = "stylesheet"; link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !order || !mapRef.current || mapObjRef.current) return;
    const L = window.L; if (!L) return;

    const map = L.map(mapRef.current).setView([53.9, 27.56], 11);
    mapObjRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);

    (async () => {
      const fromCoords = order.latitude && order.longitude
        ? { lat: parseFloat(order.latitude), lng: parseFloat(order.longitude) }
        : await geocodeAddress(order.pickupAddress).catch(() => null);
      const toCoords = order.deliveryLatitude && order.deliveryLongitude
        ? { lat: parseFloat(order.deliveryLatitude), lng: parseFloat(order.deliveryLongitude) }
        : await geocodeAddress(order.deliveryAddress).catch(() => null);

      if (!fromCoords || !toCoords) return;

      let coords = [[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]];
      try {
        const res  = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      } catch {}

      routeCoordsRef.current = coords;
      L.polyline(coords, { color: "#0d9488", weight: 4, opacity: 0.7, dashArray: "10,8" }).addTo(map);

      const fromIcon = L.divIcon({ className: "", html: `<div class="od-map-pin od-map-pin--from">A</div>`, iconSize:[36,36], iconAnchor:[18,36] });
      const toIcon   = L.divIcon({ className: "", html: `<div class="od-map-pin od-map-pin--to">Б</div>`, iconSize:[36,36], iconAnchor:[18,36] });
      L.marker([fromCoords.lat, fromCoords.lng], { icon: fromIcon }).addTo(map).bindPopup(`<b>Откуда:</b> ${order.pickupAddress}`);
      L.marker([toCoords.lat, toCoords.lng],     { icon: toIcon   }).addTo(map).bindPopup(`<b>Куда:</b> ${order.deliveryAddress}`);

      /* Анимированная машина — только когда заказ "В процессе" */
      if (order.status === "В процессе" && coords.length > 1) {
        const carIcon = L.divIcon({ className: "", html: `<div class="od-map-car"><i class="bx bxs-car"></i></div>`, iconSize:[38,38], iconAnchor:[19,19] });
        const carMarker = L.marker(coords[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        carMarkerRef.current = carMarker;

        let t = 0.1; // начинаем немного по маршруту
        const SPEED = 0.00012;
        function step() {
          t = Math.min(t + SPEED, 0.95);
          const pos = interpolate(coords, t);
          carMarker.setLatLng(pos);
          if (t < 0.95) carAnimRef.current = requestAnimationFrame(step);
        }
        carAnimRef.current = requestAnimationFrame(step);
      }

      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    })();
  }, [mapReady, order]);

  useEffect(() => () => { if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current); }, []);

  /* ── Rating ── */
  const handleRate = async () => {
    if (!rating) { setRateErr("Выберите оценку от 1 до 5"); return; }
    if (!order?.courierId) { setRateErr("Данные курьера недоступны"); return; }
    setSub(true); setRateErr("");
    try {
      await rateCourier({
        courierId: order.courierId,
        routeId:   order.routeId || null,
        rating,
        comment,
      });
      setRated(true);
    } catch (e) {
      setRateErr("Ошибка при отправке оценки. Попробуйте снова.");
    } finally { setSub(false); }
  };

  if (loading) return (
    <ClientLayout>
      <div className="od-root">
        <div className="od-skels">{[1,2,3].map(i=><div key={i} className="od-skel"/>)}</div>
      </div>
    </ClientLayout>
  );

  if (!order) return (
    <ClientLayout>
      <div className="od-root">
        <div className="od-empty-page">
          <i className="bx bx-error-circle"/>
          <p>Заказ не найден</p>
          <button className="od-back-btn" onClick={() => navigate("/client/orders")}>← Назад</button>
        </div>
      </div>
    </ClientLayout>
  );

  const sm          = STATUS_META[order.status] || { color:"#6b7280", bg:"rgba(107,114,128,0.1)" };
  const isDelivered = order.status === "Доставлен";
  const isActive    = order.status === "В процессе";

  return (
    <ClientLayout>
      <div className="od-root">

        <div className="od-header">
          <button className="od-back" onClick={() => navigate("/client/orders")}>
            <i className="bx bx-arrow-back"/> Назад
          </button>
          <div className="od-header-row">
            <h1 className="od-title">Заказ #{order.id}</h1>
            <span className="od-badge" style={{ color: sm.color, background: sm.bg }}>
              <span className="od-badge-dot" style={{ background: sm.color }}/>
              {order.status}
            </span>
          </div>
          <p className="od-created">
            <i className="bx bx-calendar"/>
            {fmtDate(order.createdAt)}
          </p>
        </div>

        {/* Map */}
        <div className="od-map-card">
          <div className="od-card-title">
            <i className="bx bx-map"/> Маршрут на карте
            {isActive && (
              <span className="od-map-live"><span className="od-live-dot"/>Курьер едет</span>
            )}
          </div>
          <div className="od-map-wrap">
            <div ref={mapRef} className="od-map"/>
            {!mapReady && <div className="od-map-loading"><div className="od-spinner"/><span>Загружаем карту...</span></div>}
          </div>
          <div className="od-map-legend">
            <div className="od-legend-item">
              <span className="od-legend-dot od-legend-dot--from"/>
              <span>{order.pickupAddress}</span>
            </div>
            <div className="od-legend-dashes"/>
            <div className="od-legend-item">
              <span className="od-legend-dot od-legend-dot--to"/>
              <span>{order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        <div className="od-grid">
          <div className="od-col">

            {/* Status */}
            <div className="od-card">
              <div className="od-card-title"><i className="bx bx-list-check"/> Прогресс доставки</div>
              <StatusSteps status={order.status}/>
            </div>

            {/* Details */}
            <div className="od-card">
              <div className="od-card-title"><i className="bx bx-info-circle"/> Детали заказа</div>
              <div className="od-route">
                <div className="od-route-row">
                  <div className="od-route-dot od-route-dot--a">A</div>
                  <div>
                    <div className="od-route-label">Откуда</div>
                    <div className="od-route-addr">{order.pickupAddress}</div>
                  </div>
                </div>
                <div className="od-route-vline"/>
                <div className="od-route-row">
                  <div className="od-route-dot od-route-dot--b">Б</div>
                  <div>
                    <div className="od-route-label">Куда</div>
                    <div className="od-route-addr">{order.deliveryAddress}</div>
                  </div>
                </div>
              </div>
              <div className="od-meta">
                {order.requestedTime && (
                  <div className="od-meta-row">
                    <span><i className="bx bx-time"/> Желаемое время</span>
                    <strong>{fmtDateTime(order.requestedTime)}</strong>
                  </div>
                )}
                {order.distanceKm && (
                  <div className="od-meta-row">
                    <span><i className="bx bx-ruler"/> Расстояние</span>
                    <strong>{parseFloat(order.distanceKm).toFixed(1)} км</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="od-col">

            {/* Courier */}
            <div className="od-card">
              <div className="od-card-title"><i className="bx bx-user"/> Курьер и транспорт</div>
              {order.courierName || order.courierId ? (
                <>
                  <div className="od-driver">
                    <div className="od-driver-avatar">
                      {order.courierName?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase() || "?"}
                    </div>
                    <div className="od-driver-info">
                      <div className="od-driver-name">{order.courierName || `Курьер #${order.courierId}`}</div>
                      {order.courierPhone && (
                        <a className="od-driver-phone" href={`tel:${order.courierPhone}`}>
                          <i className="bx bx-phone"/> {order.courierPhone}
                        </a>
                      )}
                    </div>
                    {isActive && <div className="od-driver-status"><span className="od-online-dot"/> В пути</div>}
                  </div>
                  {(order.vehicleModel || order.vehiclePlate) && (
                    <div className="od-vehicle">
                      <i className="bx bxs-car od-vehicle-icon"/>
                      <div>
                        {order.vehicleModel && <div className="od-vehicle-model">{order.vehicleModel}</div>}
                        {order.vehiclePlate && <div className="od-vehicle-plate">{order.vehiclePlate}</div>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="od-driver-pending">
                  <i className="bx bx-time-five"/>
                  <p>{order.status === "Создан" ? "Курьер ещё не назначен. Логист формирует маршрут." : "Данные курьера загружаются..."}</p>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="od-card">
              <div className="od-card-title"><i className="bx bx-star"/> Оценить доставку</div>
              {!isDelivered ? (
                <div className="od-rating-locked">
                  <i className="bx bx-lock"/>
                  <p>Оценка доступна после доставки</p>
                </div>
              ) : rated ? (
                <div className="od-rating-done">
                  <i className="bx bx-party"/>
                  <p>Спасибо за отзыв!</p>
                </div>
              ) : (
                <div className="od-rating-form">
                  <p className="od-rating-prompt">Как прошла доставка?</p>
                  <StarRating value={rating} onChange={v => { setRating(v); setRateErr(""); }}/>
                  {rateErr && <div className="od-rate-err"><i className="bx bx-error-circle"/> {rateErr}</div>}
                  <textarea className="od-textarea"
                    placeholder="Оставьте комментарий (необязательно)..."
                    value={comment} onChange={e => setComment(e.target.value)}/>
                  <button className="od-rate-btn"
                    onClick={handleRate}
                    disabled={!rating || submitting}
                    type="button">
                    <i className="bx bx-send"/>
                    {submitting ? "Отправляем..." : "Отправить оценку"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </ClientLayout>
  );
}