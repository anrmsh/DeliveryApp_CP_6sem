import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrder, rateCourier, geocodeAddress } from "../../api/clientApi";
import "../../styles/client/OrderDetail.css";

/* ── Leaflet loaded from CDN (no install needed) ── */
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/* ── Status meta ── */
const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};

const STATUSES = ["Создан", "Назначен", "В процессе", "Доставлен"];

/* progress 0-100 by status */
const STATUS_PCT = { "Создан": 0, "Назначен": 15, "В процессе": 55, "Доставлен": 100 };

/* ── Star rating ── */
function StarRating({ value, onChange }) {
  return (
    <div className="od-stars">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          className={`od-star ${value >= s ? "od-star--on" : ""}`}
          onClick={() => onChange(s)}
          type="button"
        >★</button>
      ))}
    </div>
  );
}

/* ── Status steps ── */
function StatusSteps({ status }) {
  const idx = STATUSES.indexOf(status);
  if (status === "Отменён") return (
    <div className="od-cancelled">
      <i className="bx bx-x-circle" /> Заказ отменён
    </div>
  );
  return (
    <div className="od-steps">
      {STATUSES.map((s, i) => (
        <div key={s} className="od-step-wrap">
          <div className={`od-step ${i <= idx ? "od-step--done" : ""} ${i === idx ? "od-step--active" : ""}`}>
            <div className="od-step-circle">
              {i < idx
                ? <i className="bx bx-check" />
                : i === idx
                  ? <span className="od-pulse" />
                  : <span>{i + 1}</span>}
            </div>
            <div className="od-step-label">{s}</div>
          </div>
          {i < STATUSES.length - 1 && (
            <div className={`od-step-line ${i < idx ? "od-step-line--done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Countdown timer ── */
function Countdown({ targetTime }) {
  const [left, setLeft] = useState(null);

  useEffect(() => {
    if (!targetTime) return;
    const tick = () => {
      const diff = new Date(targetTime) - Date.now();
      setLeft(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (left === null) return null;
  if (left === 0) return <div className="od-timer od-timer--done"><i className="bx bx-check-circle" /> Время доставки истекло</div>;

  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  return (
    <div className="od-timer">
      <i className="bx bx-time-five" />
      <span>До доставки:</span>
      <strong>
        {h > 0 && `${h}ч `}{m}м {String(s).padStart(2,"0")}с
      </strong>
    </div>
  );
}

/* ── Main component ── */
export default function OrderDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const mapRef    = useRef(null);   // DOM node
  const leafletRef = useRef(null);  // L instance
  const mapObjRef  = useRef(null);  // map instance
  const carMarkerRef = useRef(null);

  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState("");
  const [rated,    setRated]    = useState(false);
  const [submitting, setSub]    = useState(false);
  const [routeCoords, setRouteCoords] = useState([]); // [[lat,lng],...]
  const [mapReady, setMapReady] = useState(false);

  /* 1. Load order */
  useEffect(() => {
    (async () => {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  /* 2. Load Leaflet CSS + JS from CDN */
  useEffect(() => {
    if (document.getElementById("leaflet-css")) { setMapReady(true); return; }
    const link = document.createElement("link");
    link.id   = "leaflet-css";
    link.rel  = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  /* 3. Init map + draw route once both order and Leaflet are ready */
  useEffect(() => {
    if (!mapReady || !order || !mapRef.current) return;
    if (mapObjRef.current) return; // already initialised

    const L = window.L;
    if (!L) return;

    /* Default center — Moscow */
    const map = L.map(mapRef.current, { zoomControl: true }).setView([55.751, 37.618], 11);
    mapObjRef.current = map;
    leafletRef.current = L;

    /* OpenStreetMap tiles — free, no key */
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    /* Geocode both addresses → draw route */
    (async () => {
      const fromCoords = order.latitude && order.longitude
        ? { lat: parseFloat(order.latitude), lng: parseFloat(order.longitude) }
        : await geocodeAddress(order.pickupAddress).catch(() => null);

      const toCoords = order.deliveryLatitude && order.deliveryLongitude
        ? { lat: parseFloat(order.deliveryLatitude), lng: parseFloat(order.deliveryLongitude) }
        : await geocodeAddress(order.deliveryAddress).catch(() => null);

      if (!fromCoords || !toCoords) return;

      /* OSRM route geometry (full polyline) */
      let coords = [];
      try {
        const osrmUrl =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}` +
          `?overview=full&geometries=geojson`;
        const res  = await fetch(osrmUrl);
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        }
      } catch {}

      /* fallback straight line */
      if (coords.length === 0) {
        coords = [[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]];
      }

      setRouteCoords(coords);

      /* Draw dashed route polyline */
      L.polyline(coords, {
        color: "#0d9488",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 8",
      }).addTo(map);

      /* From marker */
      const fromIcon = L.divIcon({
        className: "",
        html: `<div class="od-map-pin od-map-pin--from"><i class="bx bxs-map"></i><span>A</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      L.marker([fromCoords.lat, fromCoords.lng], { icon: fromIcon })
        .addTo(map)
        .bindPopup(`<b>Откуда:</b> ${order.pickupAddress}`);

      /* To marker */
      const toIcon = L.divIcon({
        className: "",
        html: `<div class="od-map-pin od-map-pin--to"><i class="bx bxs-map"></i><span>Б</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      L.marker([toCoords.lat, toCoords.lng], { icon: toIcon })
        .addTo(map)
        .bindPopup(`<b>Куда:</b> ${order.deliveryAddress}`);

      /* Car marker — position depends on status */
      const pct = STATUS_PCT[order.status] ?? 0;
      const carPos = getPointOnRoute(coords, pct / 100);

      const carIcon = L.divIcon({
        className: "",
        html: `<div class="od-map-car"><i class="bx bxs-car"></i></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (pct > 0 && pct < 100) {
        const marker = L.marker(carPos, { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        carMarkerRef.current = marker;

        /* Animate car smoothly along route */
        animateCar(marker, coords, pct / 100, order.status);
      }

      /* Fit map */
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    })();
  }, [mapReady, order]);

  /* ── Rate courier ── */
  const handleRate = async () => {
    if (!rating) return;
    setSub(true);
    try {
      await rateCourier({
        courierId: order?.courierId || 0,
        routeId:   order?.routeId   || 0,
        rating,
        comment,
      });
      setRated(true);
    } catch {}
    finally { setSub(false); }
  };

  /* ── Loading ── */
  if (loading) return (
    <ClientLayout>
      <div className="od-root">
        <div className="od-skels">
          {[1,2,3].map(i => <div key={i} className="od-skel" />)}
        </div>
      </div>
    </ClientLayout>
  );

  if (!order) return (
    <ClientLayout>
      <div className="od-root">
        <div className="od-empty-page">
          <i className="bx bx-error-circle" />
          <p>Заказ не найден</p>
          <button className="od-back-btn" onClick={() => navigate("/client/orders")}>
            ← Назад к заказам
          </button>
        </div>
      </div>
    </ClientLayout>
  );

  const sm = STATUS_META[order.status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
  const isActive    = order.status === "В процессе";
  const isDelivered = order.status === "Доставлен";

  return (
    <ClientLayout>
      <div className="od-root">

        {/* ── HEADER ── */}
        <div className="od-header">
          <button className="od-back" onClick={() => navigate("/client/orders")}>
            <i className="bx bx-arrow-back" /> Назад
          </button>
          <div className="od-header-row">
            <h1 className="od-title">Заказ #{order.id}</h1>
            <span className="od-badge" style={{ color: sm.color, background: sm.bg }}>
              <span className="od-badge-dot" style={{ background: sm.color }} />
              {order.status}
            </span>
          </div>
          <p className="od-created">
            <i className="bx bx-calendar" />
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString("ru-RU")
              : "—"}
          </p>
        </div>

        {/* ── COUNTDOWN (express / requested time) ── */}
        {order.requestedTime && !isDelivered && (
          <Countdown targetTime={order.requestedTime} />
        )}

        {/* ── MAP ── */}
        <div className="od-map-card">
          <div className="od-card-title">
            <i className="bx bx-map" /> Маршрут на карте
          </div>
          <div className="od-map-wrap">
            <div ref={mapRef} className="od-map" />
            {!mapReady && (
              <div className="od-map-loading">
                <div className="od-spinner" />
                <span>Загружаем карту...</span>
              </div>
            )}
          </div>
          <div className="od-map-legend">
            <div className="od-legend-item">
              <span className="od-legend-dot od-legend-dot--from" />
              <span>{order.pickupAddress}</span>
            </div>
            <div className="od-legend-dashes" />
            <div className="od-legend-item">
              <span className="od-legend-dot od-legend-dot--to" />
              <span>{order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="od-grid">

          {/* LEFT */}
          <div className="od-col">

            {/* Status steps */}
            <div className="od-card">
              <div className="od-card-title">
                <i className="bx bx-list-check" /> Прогресс доставки
              </div>
              <StatusSteps status={order.status} />
            </div>

            {/* Route details */}
            <div className="od-card">
              <div className="od-card-title">
                <i className="bx bx-info-circle" /> Детали заказа
              </div>
              <div className="od-route">
                <div className="od-route-row">
                  <div className="od-route-dot od-route-dot--a">A</div>
                  <div>
                    <div className="od-route-label">Откуда</div>
                    <div className="od-route-addr">{order.pickupAddress}</div>
                  </div>
                </div>
                <div className="od-route-vline" />
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
                    <span><i className="bx bx-time" /> Желаемое время</span>
                    <strong>{new Date(order.requestedTime).toLocaleString("ru-RU")}</strong>
                  </div>
                )}
                {order.distanceKm && (
                  <div className="od-meta-row">
                    <span><i className="bx bx-ruler" /> Расстояние</span>
                    <strong>{parseFloat(order.distanceKm).toFixed(1)} км</strong>
                  </div>
                )}
                {order.vehicleType && (
                  <div className="od-meta-row">
                    <span><i className="bx bxs-car" /> Транспорт</span>
                    <strong>
                      {{ car: "Легковой", van: "Фургон", truck: "Грузовик" }[order.vehicleType] || order.vehicleType}
                    </strong>
                  </div>
                )}
                <div className="od-meta-row">
                  <span><i className="bx bx-hash" /> Статус</span>
                  <strong style={{ color: sm.color }}>{order.status}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="od-col">

            {/* Driver info */}
            <div className="od-card">
              <div className="od-card-title">
                <i className="bx bx-user" /> Курьер и транспорт
              </div>
              {order.courierName || order.courierId ? (
                <div className="od-driver">
                  <div className="od-driver-avatar">
                    <i className="bx bxs-user-circle" />
                  </div>
                  <div className="od-driver-info">
                    <div className="od-driver-name">
                      {order.courierName || `Курьер #${order.courierId}`}
                    </div>
                    {order.courierPhone && (
                      <a className="od-driver-phone" href={`tel:${order.courierPhone}`}>
                        <i className="bx bx-phone" /> {order.courierPhone}
                      </a>
                    )}
                  </div>
                  {isActive && (
                    <div className="od-driver-status">
                      <span className="od-online-dot" /> В пути
                    </div>
                  )}
                </div>
              ) : (
                <div className="od-driver-pending">
                  <i className="bx bx-time-five" />
                  <p>
                    {order.status === "Создан"
                      ? "Курьер ещё не назначен. Ожидайте."
                      : "Данные курьера недоступны."}
                  </p>
                </div>
              )}

              {/* Vehicle */}
              {(order.vehiclePlate || order.vehicleModel) && (
                <div className="od-vehicle">
                  <i className="bx bxs-car od-vehicle-icon" />
                  <div>
                    {order.vehicleModel && (
                      <div className="od-vehicle-model">{order.vehicleModel}</div>
                    )}
                    {order.vehiclePlate && (
                      <div className="od-vehicle-plate">{order.vehiclePlate}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="od-card">
              <div className="od-card-title">
                <i className="bx bx-star" /> Оценить доставку
              </div>
              {!isDelivered ? (
                <div className="od-rating-locked">
                  <i className="bx bx-lock" />
                  <p>Оценка доступна после доставки</p>
                </div>
              ) : rated ? (
                <div className="od-rating-done">
                  <i className="bx bx-party" />
                  <p>Спасибо за отзыв!</p>
                </div>
              ) : (
                <div className="od-rating-form">
                  <p className="od-rating-prompt">Как прошла доставка?</p>
                  <StarRating value={rating} onChange={setRating} />
                  <textarea
                    className="od-textarea"
                    placeholder="Оставьте комментарий (необязательно)..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button
                    className="od-rate-btn"
                    onClick={handleRate}
                    disabled={!rating || submitting}
                    type="button"
                  >
                    <i className="bx bx-send" />
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

/* ── Helpers ── */

/** Returns a [lat, lng] point that is `t` (0..1) along a polyline */
function getPointOnRoute(coords, t) {
  if (!coords.length) return [55.751, 37.618];
  if (t <= 0) return coords[0];
  if (t >= 1) return coords[coords.length - 1];

  let total = 0;
  const segs = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const d = dist(coords[i], coords[i + 1]);
    segs.push(d);
    total += d;
  }
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) {
      const r = target / segs[i];
      return [
        coords[i][0] + r * (coords[i+1][0] - coords[i][0]),
        coords[i][1] + r * (coords[i+1][1] - coords[i][1]),
      ];
    }
    target -= segs[i];
  }
  return coords[coords.length - 1];
}

function dist([lat1, lng1], [lat2, lng2]) {
  return Math.sqrt((lat2-lat1)**2 + (lng2-lng1)**2);
}

/**
 * Animate the car marker slowly along the route.
 * Starts at startT and moves forward at ~2 km/h visual speed.
 */
function animateCar(marker, coords, startT, status) {
  if (status !== "В процессе") return;
  let t = startT;
  const step = 0.0003; // speed (fraction of route per frame)
  const tick = () => {
    t = Math.min(t + step, 0.98);
    const pos = getPointOnRoute(coords, t);
    marker.setLatLng(pos);
    if (t < 0.98) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}