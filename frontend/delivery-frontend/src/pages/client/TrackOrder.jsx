import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import { geocodeAddress } from "../../api/clientApi";
import "../../styles/client/TrackOrder.css";
import "../../styles/client/TrackOrder.css";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

const STATUSES = ["Создан", "Назначен", "В процессе", "Доставлен"];

const STATUS_META = {
  "Создан":     { color: "#2563eb", bg: "rgba(37,99,235,0.1)",  pct: 0   },
  "Назначен":   { color: "#7c3aed", bg: "rgba(124,58,237,0.1)", pct: 15  },
  "В процессе": { color: "#d97706", bg: "rgba(217,119,6,0.1)",  pct: 55  },
  "Доставлен":  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  pct: 100 },
  "Отменён":    { color: "#dc2626", bg: "rgba(220,38,38,0.1)",  pct: 0   },
};

function fmtDateTime(val) {
  if (!val) return "—";
  const normalized = typeof val === "string" && !val.endsWith("Z") && !val.includes("+")
    ? val + "Z" : val;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU");
}

/* ── Интерполяция по polyline ── */
function interpolate(coords, t) {
  if (!coords || coords.length < 2) return coords?.[0];
  if (t <= 0) return coords[0];
  if (t >= 1) return coords[coords.length - 1];
  let total = 0;
  const segs = [];
  for (let i = 0; i < coords.length - 1; i++) {
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
  return coords[coords.length - 1];
}

/* ── Карта с анимированной машиной ── */
function TrackMap({ order }) {
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const carAnimRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (document.getElementById("lf-to-css")) { setMapReady(true); return; }
    const link = document.createElement("link");
    link.id = "lf-to-css"; link.rel = "stylesheet"; link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !order || !mapRef.current) return;
    const L = window.L; if (!L) return;

    if (mapObjRef.current) {
      mapObjRef.current.eachLayer(l => { if (!l._url) mapObjRef.current.removeLayer(l); });
      if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current);
    } else {
      const map = L.map(mapRef.current).setView([53.9, 27.56], 11);
      mapObjRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map);
    }
    const map = mapObjRef.current;

    (async () => {
      const from = order.latitude && order.longitude
        ? { lat: parseFloat(order.latitude), lng: parseFloat(order.longitude) }
        : await geocodeAddress(order.pickupAddress).catch(() => null);
      const to = order.deliveryLatitude && order.deliveryLongitude
        ? { lat: parseFloat(order.deliveryLatitude), lng: parseFloat(order.deliveryLongitude) }
        : await geocodeAddress(order.deliveryAddress).catch(() => null);
      if (!from || !to) return;

      let coords = [[from.lat, from.lng], [to.lat, to.lng]];
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates)
          coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      } catch {}

      L.polyline(coords, { color: "#0d9488", weight: 5, opacity: 0.75, dashArray: "10,7" }).addTo(map);

      const fromIcon = L.divIcon({ className: "", html: `<div class="to-map-pin to-map-pin--from">A</div>`, iconSize:[34,34], iconAnchor:[17,34] });
      const toIcon   = L.divIcon({ className: "", html: `<div class="to-map-pin to-map-pin--to">Б</div>`,  iconSize:[34,34], iconAnchor:[17,34] });
      L.marker([from.lat, from.lng], { icon: fromIcon }).addTo(map).bindPopup(`Откуда: ${order.pickupAddress}`);
      L.marker([to.lat,   to.lng  ], { icon: toIcon   }).addTo(map).bindPopup(`Куда: ${order.deliveryAddress}`);

      /* Машина — только "В процессе" */
      if (order.status === "В процессе" && coords.length > 1) {
        const carIcon = L.divIcon({ className: "", html: `<div class="to-map-car"><i class="bx bxs-car"></i></div>`, iconSize:[36,36], iconAnchor:[18,18] });
        const car = L.marker(coords[0], { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        let t = 0.05;
        function step() {
          t = Math.min(t + 0.00013, 0.95);
          car.setLatLng(interpolate(coords, t));
          if (t < 0.95) carAnimRef.current = requestAnimationFrame(step);
        }
        carAnimRef.current = requestAnimationFrame(step);
      }

      map.fitBounds(L.latLngBounds(coords), { padding: [36, 36] });
    })();
  }, [mapReady, order]);

  useEffect(() => () => { if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current); }, []);

  return (
    <div className="to-map-wrap">
      <div ref={mapRef} className="to-map" />
      {!mapReady && <div className="to-map-loading"><div className="to-spinner" /></div>}
    </div>
  );
}

/* ── Progress steps ── */
function StatusSteps({ status }) {
  const idx = STATUSES.indexOf(status);
  if (status === "Отменён") return (
    <div className="to-cancelled"><i className="bx bx-x-circle" /> Заказ отменён</div>
  );
  return (
    <div className="to-steps">
      {STATUSES.map((s, i) => (
        <div key={s} className="to-step-wrap">
          <div className={`to-step ${i <= idx ? "to-step--done" : ""} ${i === idx ? "to-step--active" : ""}`}>
            <div className="to-step-circle">
              {i < idx
                ? <i className="bx bx-check" />
                : i === idx
                  ? <span className="to-pulse" />
                  : <span>{i + 1}</span>}
            </div>
            <div className="to-step-label">{s}</div>
          </div>
          {i < STATUSES.length - 1 && (
            <div className={`to-step-line ${i < idx ? "to-step-line--done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
export default function TrackOrder() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter,   setFilter]   = useState("active"); // active | all
  const navigate = useNavigate();

  useEffect(() => {
    getOrders()
      .then(data => {
        const list = Array.isArray(data) ? data : data.content || [];
        setOrders(list);
        const active = list.filter(o => ["Создан","Назначен","В процессе"].includes(o.status));
        if (active.length > 0) setSelected(active[0]);
        else if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeOrders  = orders.filter(o => ["Создан","Назначен","В процессе"].includes(o.status));
  const displayOrders = filter === "active" ? activeOrders : orders;
  const sm = selected ? STATUS_META[selected.status] : null;

  return (
    <ClientLayout>
      <div className="to-root">

        <div className="to-hero">
          <div>
            <h1 className="to-title">Отслеживание</h1>
            <p className="to-sub">Следите за статусом доставки в реальном времени</p>
          </div>
          <div className="to-filter-tabs">
            <button className={`to-filter-tab ${filter === "active" ? "to-filter-tab--active" : ""}`}
              onClick={() => setFilter("active")}>
              Активные {activeOrders.length > 0 && <span className="to-count">{activeOrders.length}</span>}
            </button>
            <button className={`to-filter-tab ${filter === "all" ? "to-filter-tab--active" : ""}`}
              onClick={() => setFilter("all")}>
              Все {orders.length > 0 && <span className="to-count">{orders.length}</span>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="to-skels">{[1,2].map(i => <div key={i} className="to-skel" />)}</div>
        ) : displayOrders.length === 0 ? (
          <div className="to-empty">
            <i className="bx bx-map-alt" />
            <p>{filter === "active" ? "Нет активных заказов" : "У вас нет заказов"}</p>
            {filter === "active"
              ? <button className="to-btn" onClick={() => setFilter("all")}>Показать все</button>
              : <button className="to-btn" onClick={() => navigate("/client/create")}>Создать заказ</button>
            }
          </div>
        ) : (
          <div className="to-grid">

            {/* Список заказов */}
            <div className="to-list-col">
              <div className="to-list-title">
                {filter === "active" ? "Активные заказы" : "Все заказы"}
              </div>
              <div className="to-list">
                {displayOrders.map(o => {
                  const m = STATUS_META[o.status] || { color:"#6b7280", bg:"rgba(107,114,128,0.1)" };
                  return (
                    <div key={o.id}
                      className={`to-order-card ${selected?.id === o.id ? "to-order-card--active" : ""}`}
                      onClick={() => setSelected(o)}>
                      <div className="to-order-card-top">
                        <span className="to-order-id">Заказ #{o.id}</span>
                        <span className="to-order-badge" style={{ color: m.color, background: m.bg }}>
                          {o.status}
                        </span>
                      </div>
                      <div className="to-order-addr">
                        <i className="bx bx-map" /> {o.deliveryAddress}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Детали выбранного */}
            {selected && (
              <div className="to-detail-col">

                {/* Map */}
                <div className="to-card">
                  <div className="to-card-title">
                    <i className="bx bx-map" /> Маршрут
                    {selected.status === "В процессе" && (
                      <span className="to-live-badge"><span className="to-live-dot" />Курьер едет</span>
                    )}
                  </div>
                  <TrackMap order={selected} />
                </div>

                {/* Progress */}
                <div className="to-card">
                  <div className="to-card-title"><i className="bx bx-list-check" /> Прогресс</div>
                  <StatusSteps status={selected.status} />
                </div>

                {/* Details */}
                <div className="to-card">
                  <div className="to-card-title"><i className="bx bx-info-circle" /> Детали</div>
                  <div className="to-details">
                    {[
                      { icon:"bx-hash",    label:"Заказ",        val:`#${selected.id}` },
                      { icon:"bx-map-pin", label:"Откуда",       val:selected.pickupAddress },
                      { icon:"bxs-map",    label:"Куда",         val:selected.deliveryAddress },
                      ...(selected.requestedTime ? [{ icon:"bx-time", label:"Желаемое время", val:fmtDateTime(selected.requestedTime) }] : []),
                      ...(selected.courierName ? [{ icon:"bx-user", label:"Курьер", val:selected.courierName }] : []),
                    ].map(r => (
                      <div key={r.label} className="to-detail-row">
                        <span><i className={`bx ${r.icon}`} /> {r.label}</span>
                        <strong>{r.val}</strong>
                      </div>
                    ))}
                  </div>
                  <button className="to-detail-btn" onClick={() => navigate(`/client/orders/${selected.id}`)}>
                    <i className="bx bx-show" /> Полная карточка
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}