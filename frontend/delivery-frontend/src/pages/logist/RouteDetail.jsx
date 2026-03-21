import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/RouteDetail.css";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/* Точка выезда — Минск, пр-т Независимости 32 */
const DEPOT = {
  lat: 53.9006,
  lng: 27.5590,
  label: "Депо — пр-т Независимости, 32, Минск",
};

const STATUS_META = {
  "Запланирован": { color: "#2563eb", bg: "rgba(37,99,235,0.1)"  },
  "Активен":      { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "Завершён":     { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "Отменён":      { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};

/* ── SVG van icon ── */
function VehicleSvg() {
  return (
    <svg width="68" height="38" viewBox="0 0 110 66" fill="none">
      <rect x="0" y="14" width="75" height="36" rx="4" fill="#3b82f6"/>
      <rect x="75" y="20" width="28" height="30" rx="4" fill="#2563eb"/>
      <rect x="78" y="23" width="20" height="13" rx="2" fill="#bfdbfe" opacity="0.85"/>
      <circle cx="16" cy="54" r="10" fill="#1e3a8a"/>
      <circle cx="16" cy="54" r="5"  fill="#93c5fd"/>
      <circle cx="90" cy="54" r="10" fill="#1e3a8a"/>
      <circle cx="90" cy="54" r="5"  fill="#93c5fd"/>
      <rect x="100" y="30" width="6" height="6" rx="2" fill="#fbbf24"/>
    </svg>
  );
}

export default function RouteDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);

  const [route,     setRoute]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [mapReady,  setMapReady]  = useState(false);
  const [approving, setApproving] = useState(false);
  const [msg,       setMsg]       = useState("");

  /* Load route */
  useEffect(() => {
    axiosClient.get(`/logist/routes/${id}`)
      .then(r => setRoute(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  /* Load Leaflet */
  useEffect(() => {
    if (document.getElementById("lf-rd-css")) { setMapReady(true); return; }
    const link   = document.createElement("link");
    link.id      = "lf-rd-css";
    link.rel     = "stylesheet";
    link.href    = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src   = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  /* Init map */
  useEffect(() => {
    if (!mapReady || !route || !mapRef.current || mapObjRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([DEPOT.lat, DEPOT.lng], 11);
    mapObjRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(map);

    /* Depot */
    const depotIcon = L.divIcon({
      className: "",
      html: `<div class="rd-map-depot"><i class="bx bxs-home-circle"></i></div>`,
      iconSize: [38, 38], iconAnchor: [19, 38],
    });
    L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon })
      .addTo(map)
      .bindPopup(`<b>Депо (старт/финиш)</b><br>${DEPOT.label}`);

    const pts = (route.points || []).filter(p => p.latitude && p.longitude);

    /* Route: depot → points → depot */
    const coordList = [
      [DEPOT.lat, DEPOT.lng],
      ...pts.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]),
      [DEPOT.lat, DEPOT.lng],
    ];

    /* OSRM real-road route */
    (async () => {
      try {
        const osrmCoords = coordList.map(([lat, lng]) => `${lng},${lat}`).join(";");
        const res  = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          const latlngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          L.polyline(latlngs, { color: "#2563eb", weight: 4, opacity: 0.75, dashArray: "9,6" }).addTo(map);
        }
      } catch {
        L.polyline(coordList, { color: "#2563eb", weight: 3, opacity: 0.55, dashArray: "9,6" }).addTo(map);
      }

      /* Delivery point markers */
      pts.forEach((p, i) => {
        const done  = p.status === "Посещена";
        const skip  = p.status === "Пропущена";
        const color = done ? "#16a34a" : skip ? "#dc2626" : "#2563eb";
        const inner = done
          ? `<i class="bx bx-check"></i>`
          : skip
            ? `<i class="bx bx-x"></i>`
            : `<span>${i + 1}</span>`;
        const icon = L.divIcon({
          className: "",
          html: `<div class="rd-map-pin" style="background:${color}">${inner}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 32],
        });
        L.marker([parseFloat(p.latitude), parseFloat(p.longitude)], { icon })
          .addTo(map)
          .bindPopup(`<b>${i + 1}. ${p.address}</b><br>Статус: ${p.status}`);
      });

      /* Fit bounds */
      const allPts = coordList.filter((_, i) => !(i === 0 && coordList.length > 1));
      if (allPts.length > 1) map.fitBounds(L.latLngBounds(allPts), { padding: [40, 40] });
    })();
  }, [mapReady, route]);

  /* Approve */
  const handleApprove = async () => {
    setApproving(true);
    try {
      const r = await axiosClient.post(`/logist/routes/${id}/approve`);
      setRoute(r.data);
      setMsg("Маршрут утверждён и отправлен курьеру");
    } catch { setMsg("Ошибка при утверждении"); }
    finally { setApproving(false); }
  };

  /* Reject */
  const handleReject = async () => {
    try {
      const r = await axiosClient.post(`/logist/routes/${id}/reject`);
      setRoute(r.data);
      setMsg("Маршрут отклонён. Заказы возвращены в очередь.");
    } catch { setMsg("Ошибка"); }
  };

  if (loading) return (
    <LogistLayout>
      <div className="rd-root">
        <div className="rd-skels">{[1,2,3].map(i => <div key={i} className="rd-skel"/>)}</div>
      </div>
    </LogistLayout>
  );

  if (!route) return (
    <LogistLayout>
      <div className="rd-root">
        <button className="rd-back" onClick={() => navigate("/logist/routes")}>
          <i className="bx bx-arrow-back"/> Назад
        </button>
        <div className="rd-empty"><i className="bx bx-error-circle"/><p>Маршрут не найден</p></div>
      </div>
    </LogistLayout>
  );

  const sm      = STATUS_META[route.status] || STATUS_META["Запланирован"];
  const isDraft = route.status === "Запланирован";
  const done    = (route.points || []).filter(p => p.status === "Посещена").length;
  const total   = (route.points || []).length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <LogistLayout>
      <div className="rd-root">

        {/* Back */}
        <button className="rd-back" onClick={() => navigate("/logist/routes")}>
          <i className="bx bx-arrow-back"/> К маршрутам
        </button>

        {/* Header */}
        <div className="rd-header">
          <div className="rd-header-left">
            <h1 className="rd-title">Маршрут #{route.id}</h1>
            <div className="rd-header-badges">
              <span className="rd-badge" style={{ color: sm.color, background: sm.bg }}>
                <span className="rd-badge-dot" style={{ background: sm.color }}/>
                {route.status}
              </span>
              {isDraft && <span className="rd-pending">Ожидает утверждения</span>}
            </div>
          </div>
          {isDraft && (
            <div className="rd-header-actions">
              <button className="rd-btn-approve" onClick={handleApprove} disabled={approving}>
                <i className="bx bx-check-circle"/>
                {approving ? "Утверждаем..." : "Утвердить"}
              </button>
              <button className="rd-btn-reject" onClick={handleReject}>
                <i className="bx bx-x-circle"/> Отклонить
              </button>
            </div>
          )}
        </div>

        {msg && (
          <div className={`rd-msg ${msg.includes("Ошибка") ? "rd-msg--err" : "rd-msg--ok"}`}>
            <i className={`bx ${msg.includes("Ошибка") ? "bx-error-circle" : "bx-check-circle"}`}/>
            {msg}
          </div>
        )}

        {/* Map */}
        <div className="rd-card rd-map-card">
          <div className="rd-card-title"><i className="bx bx-map"/> Карта маршрута</div>
          <div className="rd-map-wrap">
            <div ref={mapRef} className="rd-map"/>
            {!mapReady && (
              <div className="rd-map-loading"><div className="rd-spinner"/><span>Загружаем карту...</span></div>
            )}
          </div>
          <div className="rd-map-legend">
            <span className="rd-legend-item"><span className="rd-ldot rd-ldot--depot"/><span>Депо (старт/финиш)</span></span>
            <span className="rd-legend-dash"/>
            <span className="rd-legend-item"><span className="rd-ldot rd-ldot--point"/><span>Точки доставки</span></span>
          </div>
        </div>

        {/* Grid */}
        <div className="rd-grid">

          {/* Driver & vehicle */}
          <div className="rd-card">
            <div className="rd-card-title"><i className="bx bx-user"/> Курьер и транспорт</div>

            <div className="rd-driver-row">
              <div className="rd-driver-avatar">
                {route.courierName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "?"}
              </div>
              <div>
                <div className="rd-driver-name">{route.courierName || "—"}</div>
                {route.courierId && <div className="rd-driver-sub">ID #{route.courierId}</div>}
              </div>
            </div>

            {(route.vehicleModel || route.vehiclePlate) && (
              <div className="rd-vehicle-row">
                <VehicleSvg/>
                <div>
                  <div className="rd-vehicle-model">{route.vehicleModel || "—"}</div>
                  <div className="rd-vehicle-plate">
                    <i className="bx bx-id-card"/> {route.vehiclePlate || "—"}
                  </div>
                </div>
              </div>
            )}

            <div className="rd-meta">
              {route.plannedStart && (
                <div className="rd-meta-row">
                  <span><i className="bx bx-time"/> Начало</span>
                  <strong>{new Date(route.plannedStart).toLocaleString("ru-RU")}</strong>
                </div>
              )}
              {route.plannedEnd && (
                <div className="rd-meta-row">
                  <span><i className="bx bx-time-five"/> Конец</span>
                  <strong>{new Date(route.plannedEnd).toLocaleString("ru-RU")}</strong>
                </div>
              )}
              {route.actualDistanceKm && (
                <div className="rd-meta-row">
                  <span><i className="bx bx-trip"/> Пробег</span>
                  <strong>{route.actualDistanceKm} км</strong>
                </div>
              )}
              <div className="rd-meta-row">
                <span><i className="bx bx-list-ul"/> Выполнено</span>
                <strong>{done}/{total} точек ({pct}%)</strong>
              </div>
            </div>

            {/* Progress */}
            {total > 0 && (
              <div className="rd-progress-wrap">
                <div className="rd-progress-bar">
                  <div className="rd-progress-fill" style={{ width: `${pct}%` }}/>
                </div>
              </div>
            )}
          </div>

          {/* Route points timeline */}
          <div className="rd-card">
            <div className="rd-card-title">
              <i className="bx bx-map-pin"/> Точки маршрута
              <span className="rd-pts-count">{total}</span>
            </div>

            <div className="rd-timeline">

              {/* Depot start */}
              <div className="rd-tl-item rd-tl-item--depot">
                <div className="rd-tl-dot rd-tl-dot--depot"><i className="bx bxs-home-circle"/></div>
                <div className="rd-tl-line rd-tl-line--done"/>
                <div className="rd-tl-content">
                  <div className="rd-tl-label">Старт — Депо</div>
                  <div className="rd-tl-addr">{DEPOT.label}</div>
                </div>
              </div>

              {/* Delivery stops */}
              {(route.points || []).map((p, i) => {
                const isLast = i === route.points.length - 1;
                const done2  = p.status === "Посещена";
                const skip2  = p.status === "Пропущена";
                return (
                  <div key={p.id} className="rd-tl-item">
                    <div className={`rd-tl-dot ${done2 ? "rd-tl-dot--done" : skip2 ? "rd-tl-dot--skip" : "rd-tl-dot--wait"}`}>
                      {done2 && <i className="bx bx-check"/>}
                      {skip2 && <i className="bx bx-x"/>}
                      {!done2 && !skip2 && <span>{p.sequenceNumber}</span>}
                    </div>
                    {!isLast && <div className={`rd-tl-line ${done2 ? "rd-tl-line--done" : ""}`}/>}
                    <div className="rd-tl-content">
                      <div className="rd-tl-label">
                        Точка {p.sequenceNumber}
                        {p.orderId && <span className="rd-tl-order">· Заказ #{p.orderId}</span>}
                      </div>
                      <div className="rd-tl-addr">{p.address}</div>
                      {p.plannedArrival && (
                        <div className="rd-tl-time">
                          <i className="bx bx-time"/>
                          {new Date(p.plannedArrival).toLocaleTimeString("ru-RU", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      )}
                      <span className={`rd-tl-status rd-s-${(p.status||"").replace(/\s/g,"")}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Depot return */}
              {total > 0 && (
                <div className="rd-tl-item rd-tl-item--depot">
                  <div className="rd-tl-dot rd-tl-dot--depot"><i className="bx bxs-home-circle"/></div>
                  <div className="rd-tl-content">
                    <div className="rd-tl-label">Финиш — Возврат в Депо</div>
                    <div className="rd-tl-addr">{DEPOT.label}</div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </LogistLayout>
  );
}