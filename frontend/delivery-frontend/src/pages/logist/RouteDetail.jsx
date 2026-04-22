import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDateTime, fmtTime } from "../../utils/dateUtils";
import "../../styles/logist/RouteDetail.css";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const DEPOT = { lat: 53.9006, lng: 27.5590, label: "Депо — пр-т Независимости, 32" };

const PRICE_PER_KM   = 0.80;
const BASE_PRICE     = 3.50;
const FUEL_RATE      = 2.15;
const FUEL_PER_100KM = 10.0;
const SALARY_PER_H   = 8.50;
const AVG_SPEED      = 30.0;

const STATUS_COLORS = {
  "Запланирован": { color:"#2563eb", bg:"rgba(37,99,235,0.1)"  },
  "Активен":      { color:"#d97706", bg:"rgba(217,119,6,0.1)"  },
  "Завершён":     { color:"#16a34a", bg:"rgba(22,163,74,0.1)"  },
  "Отменён":      { color:"#dc2626", bg:"rgba(220,38,38,0.1)"  },
};

function StatusBadge({ status }) {
  const m = STATUS_COLORS[status] || { color:"#6b7280", bg:"rgba(107,114,128,0.1)" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      color:m.color, background:m.bg, borderRadius:99, padding:"4px 12px",
      fontSize:"0.8rem", fontWeight:700 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:m.color, display:"inline-block" }}/>
      {status}
    </span>
  );
}

export default function RouteDetail() {
  const { routeId } = useParams();
  const navigate    = useNavigate();
  const mapRef      = useRef(null);
  const mapObjRef   = useRef(null);

  const [route,    setRoute]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [approving,setApproving]= useState(false);
  const [msg,      setMsg]      = useState("");

  useEffect(() => {
    axiosClient.get(`/logist/routes/${routeId}`)
      .then(r => setRoute(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [routeId]);

  useEffect(() => {
    if (document.getElementById("lf-rd-css")) { setMapReady(true); return; }
    const link = document.createElement("link");
    link.id = "lf-rd-css"; link.rel = "stylesheet"; link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapReady || !route || !mapRef.current) return;
    const L = window.L; if (!L) return;

    if (!mapObjRef.current) {
      const map = L.map(mapRef.current).setView([DEPOT.lat, DEPOT.lng], 11);
      mapObjRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map);
    }
    const map = mapObjRef.current;
    map.eachLayer(l => { if (!l._url) map.removeLayer(l); });

    const depotIcon = L.divIcon({
      className: "",
      html: `<div class="rd-map-depot"><i class="bx bxs-home-circle"></i></div>`,
      iconSize: [36,36], iconAnchor: [18,36],
    });
    L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon })
      .addTo(map).bindPopup(`<b>Депо</b><br>${DEPOT.label}`);

    const points = Array.isArray(route.points) ? route.points : [];

    (async () => {
      // Геокодируем точки у которых нет координат
      const enriched = await Promise.all(
        points.map(async p => {
          if (p.latitude && p.longitude) return p;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(p.address)}&format=json&limit=1`,
              { headers: { "User-Agent": "Delivry/1.0" } }
            );
            const data = await res.json();
            if (data[0]) return { ...p, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
          } catch {}
          return p;
        })
      );

      const valid = enriched.filter(p => p.latitude && p.longitude);
      const coordList = [
        [DEPOT.lat, DEPOT.lng],
        ...valid.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]),
      ];

      // OSRM маршрут
      if (coordList.length >= 2) {
        try {
          const osrmStr = coordList.map(([lat,lng]) => `${lng},${lat}`).join(";");
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${osrmStr}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data.routes?.[0]?.geometry?.coordinates) {
            const latlngs = data.routes[0].geometry.coordinates.map(([lng,lat]) => [lat,lng]);
            L.polyline(latlngs, { color:"#2563eb", weight:5, opacity:0.75, dashArray:"10,6" }).addTo(map);
          } else {
            L.polyline(coordList, { color:"#2563eb", weight:4, opacity:0.5, dashArray:"10,6" }).addTo(map);
          }
        } catch {
          L.polyline(coordList, { color:"#2563eb", weight:4, opacity:0.5, dashArray:"10,6" }).addTo(map);
        }
      }

      // Маркеры точек
      const allBounds = [[DEPOT.lat, DEPOT.lng]];
      valid.forEach((p, i) => {
        const lat = parseFloat(p.latitude), lng = parseFloat(p.longitude);
        allBounds.push([lat, lng]);
        const isDone = p.status === "Посещена", isSkip = p.status === "Пропущена";
        const color  = isDone ? "#16a34a" : isSkip ? "#dc2626" : "#2563eb";
        const inner  = isDone
          ? `<i class="bx bx-check"></i>`
          : isSkip ? `<i class="bx bx-x"></i>` : `<span>${i+1}</span>`;
        const icon = L.divIcon({
          className: "",
          html: `<div class="rd-map-pin" style="background:${color}">${inner}</div>`,
          iconSize:[32,32], iconAnchor:[16,32],
        });
        const popup = [
          `<b>${i+1}. ${p.address}</b>`,
          p.clientName  ? `Клиент: ${p.clientName}` : "",
          p.clientPhone ? `Тел: <a href="tel:${p.clientPhone}">${p.clientPhone}</a>` : "",
          `Статус: <b>${p.status}</b>`,
          p.plannedArrival ? `Плановое: ${fmtTime(p.plannedArrival)}` : "",
        ].filter(Boolean).join("<br>");
        L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);
      });

      if (allBounds.length > 1)
        map.fitBounds(L.latLngBounds(allBounds), { padding: [36,36] });
    })();
  }, [mapReady, route]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const r = await axiosClient.post(`/logist/routes/${routeId}/approve`);
      setRoute(r.data);
      setMsg("Маршрут утверждён и отправлен курьеру");
    } catch { setMsg("Ошибка при утверждении"); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    try {
      const r = await axiosClient.post(`/logist/routes/${routeId}/reject`);
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

  const points  = Array.isArray(route.points) ? route.points : [];
  const done    = points.filter(p => p.status === "Посещена").length;
  const pct     = points.length > 0 ? Math.round(done / points.length * 100) : 0;
  const isDraft = route.status === "Запланирован";

  const km    = parseFloat(route.actualDistanceKm || 0);
  const hours = km / AVG_SPEED;
  const rev   = +(BASE_PRICE * points.length + km * PRICE_PER_KM).toFixed(2);
  const fuel  = +(km * FUEL_PER_100KM / 100 * FUEL_RATE).toFixed(2);
  const sal   = +(hours * SALARY_PER_H).toFixed(2);
  const exp   = +(fuel + sal).toFixed(2);
  const profit= +(rev - exp).toFixed(2);

  return (
    <LogistLayout>
      <div className="rd-root">

        <div className="rd-header">
          <button className="rd-back" onClick={() => navigate("/logist/routes")}>
            <i className="bx bx-arrow-back"/> Маршруты
          </button>
          <div className="rd-header-row">
            <h1 className="rd-title">Маршрут #{route.id}</h1>
            <StatusBadge status={route.status}/>
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
        </div>

        {msg && (
          <div className={`rd-msg ${msg.includes("Ошибка") ? "rd-msg--err" : "rd-msg--ok"}`}>
            <i className={`bx ${msg.includes("Ошибка") ? "bx-error-circle" : "bx-check-circle"}`}/>
            {msg}
          </div>
        )}

        {/* Map */}
        <div className="rd-card rd-map-card">
          <div className="rd-card-title">
            <i className="bx bx-map"/> Карта маршрута
            <span className="rd-point-count">{points.length} точек</span>
          </div>
          <div className="rd-map-wrap">
            <div ref={mapRef} className="rd-map"/>
            {!mapReady && <div className="rd-map-loading"><div className="rd-spinner"/></div>}
          </div>
        </div>

        <div className="rd-grid">
          <div className="rd-col">

            <div className="rd-card">
              <div className="rd-card-title"><i className="bx bx-info-circle"/> Информация</div>
              <div className="rd-rows">
                {[
                  { icon:"bx-user",   label:"Курьер",    val: route.courierName || "—" },
                  { icon:"bxs-truck", label:"Транспорт", val: [route.vehicleModel, route.vehiclePlate].filter(Boolean).join(" · ") || "—" },
                  { icon:"bx-time",   label:"Старт",     val: fmtDateTime(route.plannedStart) },
                  { icon:"bx-ruler",  label:"Пробег",    val: route.actualDistanceKm ? `${route.actualDistanceKm} км` : "—" },
                ].map(r => (
                  <div key={r.label} className="rd-row">
                    <span><i className={`bx ${r.icon}`}/> {r.label}</span>
                    <strong>{r.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="rd-card">
              <div className="rd-card-title"><i className="bx bx-bar-chart-alt"/> Прогресс</div>
              <div className="rd-progress-top">
                <span>{done}/{points.length} точек</span>
                <span>{pct}%</span>
              </div>
              <div className="rd-progress-bg">
                <div className="rd-progress-fill" style={{ width:`${pct}%` }}/>
              </div>
            </div>

            {km > 0 && (
              <div className="rd-card rd-eco-card">
                <div className="rd-card-title"><i className="bx bx-money"/> Экономика</div>
                <div className="rd-rows">
                  <div className="rd-row"><span>Выручка</span>   <strong>{rev} BYN</strong></div>
                  <div className="rd-row"><span>Топливо</span>   <strong style={{color:"#dc2626"}}>−{fuel} BYN</strong></div>
                  <div className="rd-row"><span>Зарплата</span>  <strong style={{color:"#dc2626"}}>−{sal} BYN</strong></div>
                  <div className="rd-row rd-row--profit"><span>Прибыль</span><strong style={{color:"#16a34a"}}>{profit} BYN</strong></div>
                </div>
              </div>
            )}
          </div>

          <div className="rd-col">
            <div className="rd-card">
              <div className="rd-card-title"><i className="bx bx-map-pin"/> Точки</div>

              <div className="rd-depot-row">
                <div className="rd-depot-dot"><i className="bx bxs-home-circle"/></div>
                <div className="rd-vline rd-vline--done"/>
                <div>
                  <div className="rd-pt-label">Депо (старт)</div>
                  <div className="rd-pt-addr">{DEPOT.label}</div>
                  {route.plannedStart && <div className="rd-pt-time"><i className="bx bx-time"/> {fmtTime(route.plannedStart)}</div>}
                </div>
              </div>

              {points.map((p, i) => {
                const isDone = p.status === "Посещена";
                const isSkip = p.status === "Пропущена";
                return (
                  <div key={p.id} className="rd-point">
                    <div className={`rd-pt-dot ${isDone?"rd-pt-dot--done":isSkip?"rd-pt-dot--skip":"rd-pt-dot--wait"}`}>
                      {isDone && <i className="bx bx-check"/>}
                      {isSkip && <i className="bx bx-x"/>}
                      {!isDone && !isSkip && <span>{i+1}</span>}
                    </div>
                    {i < points.length-1 && <div className={`rd-vline ${isDone?"rd-vline--done":""}`}/>}
                    <div className="rd-pt-body">
                      <div className="rd-pt-label">
                        Точка {p.sequenceNumber}
                        {p.orderId && <span className="rd-pt-order"> · Заказ #{p.orderId}</span>}
                      </div>
                      <div className="rd-pt-addr">{p.address}</div>
                      {(p.clientName || p.clientPhone) && (
                        <div className="rd-pt-client">
                          {p.clientName && <span><i className="bx bx-user"/> {p.clientName}</span>}
                          {p.clientPhone && (
                            <a href={`tel:${p.clientPhone}`} className="rd-pt-phone">
                              <i className="bx bx-phone"/> {p.clientPhone}
                            </a>
                          )}
                        </div>
                      )}
                      {p.plannedArrival && <div className="rd-pt-time"><i className="bx bx-time"/> {fmtTime(p.plannedArrival)}</div>}
                      {isDone && p.actualArrival && <div className="rd-pt-actual"><i className="bx bx-check-circle"/> Прибыл: {fmtTime(p.actualArrival)}</div>}
                      <div className={`rd-pt-status rd-pt-status--${isDone?"done":isSkip?"skip":"wait"}`}>{p.status}</div>
                    </div>
                  </div>
                );
              })}

              <div className="rd-depot-row" style={{ marginTop:8 }}>
                <div className="rd-depot-dot"><i className="bx bxs-home-circle"/></div>
                <div>
                  <div className="rd-pt-label">Депо (финиш)</div>
                  <div className="rd-pt-addr">{DEPOT.label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LogistLayout>
  );
}