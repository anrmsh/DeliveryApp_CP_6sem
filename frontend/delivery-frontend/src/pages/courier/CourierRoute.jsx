import { useEffect, useState, useRef, useCallback } from "react";
import CourierLayout from "../../components/layout/CourierLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDate, fmtDateTime, fmtTime } from "../../dateUtils";
import "../../styles/courier/CourierRoute.css";

const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const DEPOT = { lat: 53.9006, lng: 27.5590, label: "Депо — пр-т Независимости, 32" };

function weatherIcon(code) {
  if (!code && code !== 0) return "bx-cloud";
  if (code === 0) return "bx-sun";
  if (code <= 3)  return "bx-cloud-light-rain";
  if (code <= 48) return "bx-fog";
  if (code <= 67) return "bx-cloud-rain";
  if (code <= 77) return "bx-cloud-snow";
  if (code >= 95) return "bx-cloud-lightning";
  return "bx-cloud";
}

function weatherLabel(code) {
  if (code === 0) return "Ясно";
  if (code <= 3)  return "Облачно";
  if (code <= 48) return "Туман";
  if (code <= 67) return "Дождь";
  if (code <= 77) return "Снег";
  if (code >= 95) return "Гроза";
  return "Переменно";
}

/* ── Интерполяция точки вдоль polyline ── */
function interpolateRoute(coords, t) {
  if (!coords || coords.length < 2) return coords?.[0] ?? [DEPOT.lat, DEPOT.lng];
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
      return [
        coords[i][0] + r * (coords[i+1][0] - coords[i][0]),
        coords[i][1] + r * (coords[i+1][1] - coords[i][1]),
      ];
    }
    target -= segs[i];
  }
  return coords[coords.length - 1];
}

export default function CourierRoute() {
  const [route,        setRoute]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [weather,      setWeather]      = useState(null);
  const [mapReady,     setMapReady]     = useState(false);
  const [courierPos,   setCourierPos]   = useState(null);
  const [geoAllowed,   setGeoAllowed]   = useState(false);
  const [updating,     setUpdating]     = useState(null);
  const [completing,   setCompleting]   = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [actualKm,     setActualKm]     = useState("");
  const [showComplete, setShowComplete] = useState(false);
  const [msg,          setMsg]          = useState(null);

  const mapRef       = useRef(null);
  const mapObjRef    = useRef(null);
  const carMarkerRef = useRef(null);
  const carAnimRef   = useRef(null);

  /* Load route */
  const loadRoute = useCallback(async () => {
    try {
      const r = await axiosClient.get("/courier/route/current");
      setRoute(r.data);
      setLoading(false);
      const firstPt = r.data?.points?.[0];
      const lat = firstPt?.latitude ?? DEPOT.lat;
      const lng = firstPt?.longitude ?? DEPOT.lng;
      const wr = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,weathercode,precipitation`
      );
      const wd = await wr.json();
      if (wd.current) setWeather(wd.current);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { loadRoute(); }, [loadRoute]);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setCourierPos({ lat: coords.latitude, lng: coords.longitude });
        setGeoAllowed(true);
      },
      () => setGeoAllowed(false),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  /* Load Leaflet */
  useEffect(() => {
    if (document.getElementById("lf-cr-css")) { setMapReady(true); return; }
    const link   = document.createElement("link");
    link.id      = "lf-cr-css"; link.rel = "stylesheet"; link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src   = LEAFLET_JS;
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  /* Animated car along OSRM route */
  function startCarAnimation(marker, coords) {
    if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current);
    let t = 0;
    const SPEED = 0.00015; // скорость — доля маршрута за кадр
    function step() {
      t = Math.min(t + SPEED, 0.98);
      const pos = interpolateRoute(coords, t);
      marker.setLatLng(pos);
      if (t < 0.98) carAnimRef.current = requestAnimationFrame(step);
    }
    carAnimRef.current = requestAnimationFrame(step);
  }

  /* Init / update map */
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
    map.eachLayer(layer => { if (!layer._url) map.removeLayer(layer); });
    if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current);

    const depotIcon = L.divIcon({
      className: "",
      html: `<div class="cr-map-depot"><i class="bx bxs-home-circle"></i></div>`,
      iconSize: [36, 36], iconAnchor: [18, 36],
    });
    L.marker([DEPOT.lat, DEPOT.lng], { icon: depotIcon })
      .addTo(map).bindPopup(`<b>Депо</b><br>${DEPOT.label}`);

    const pts = (route.points || []).filter(p => p.latitude && p.longitude);

    (async () => {
      /* OSRM — строим маршрут только по pending точкам */
      const pending = pts.filter(p => p.status === "Ожидается");
      const routePts = pending.length > 0 ? pending : pts;
      const coordList = [
        [DEPOT.lat, DEPOT.lng],
        ...routePts.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]),
      ];

      let routeCoords = coordList;
      try {
        const osrmStr = coordList.map(([lat, lng]) => `${lng},${lat}`).join(";");
        const res  = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${osrmStr}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.routes?.[0]?.geometry?.coordinates) {
          routeCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          L.polyline(routeCoords, { color: "#15803d", weight: 5, opacity: 0.8, dashArray: "10,6" }).addTo(map);
        }
      } catch {
        L.polyline(coordList, { color: "#15803d", weight: 4, opacity: 0.6 }).addTo(map);
      }
      /* Courier marker */
      const isActive = route.status === "Активен";
      const markerCoords = courierPos ? [courierPos.lat, courierPos.lng] : routeCoords[0];
      if (isActive && markerCoords) {
        const carIcon = L.divIcon({
          className: "",
          html: `<div class="cr-map-car"><i class="bx bxs-navigation"></i></div>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });
        const carMarker = L.marker(markerCoords, { icon: carIcon, zIndexOffset: 1000 }).addTo(map);
        carMarker.bindPopup(geoAllowed ? "<b>Вы на маршруте</b>" : "<b>Текущая метка курьера</b>");
        carMarkerRef.current = carMarker;
        if (!courierPos && routeCoords.length > 1) {
          startCarAnimation(carMarker, routeCoords);
        }
      }

      /* Point markers */
      const allBounds = [[DEPOT.lat, DEPOT.lng]];
      pts.forEach((p, i) => {
        const done = p.status === "Посещена", skip = p.status === "Пропущена";
        const color = done ? "#16a34a" : skip ? "#dc2626" : "#15803d";
        const inner = done ? `<i class="bx bx-check"></i>` : skip ? `<i class="bx bx-x"></i>` : `<span>${i+1}</span>`;
        const icon = L.divIcon({
          className: "",
          html: `<div class="cr-map-pin" style="background:${color}">${inner}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 32],
        });
        const popup = `<b>${i+1}. ${p.address}</b><br>
          ${p.clientName ? `Клиент: ${p.clientName}<br>` : ""}
          ${p.clientPhone ? `Тел: <a href="tel:${p.clientPhone}">${p.clientPhone}</a><br>` : ""}
          Статус: ${p.status}`;
        L.marker([parseFloat(p.latitude), parseFloat(p.longitude)], { icon }).addTo(map).bindPopup(popup);
        allBounds.push([parseFloat(p.latitude), parseFloat(p.longitude)]);
      });

      if (courierPos) {
        allBounds.push([courierPos.lat, courierPos.lng]);
      }
      if (allBounds.length > 1) map.fitBounds(L.latLngBounds(allBounds), { padding: [30, 30] });
    })();
  }, [courierPos, geoAllowed, mapReady, route]);

  /* Cleanup animation on unmount */
  useEffect(() => () => { if (carAnimRef.current) cancelAnimationFrame(carAnimRef.current); }, []);

  /* START ROUTE */
  const handleStart = async () => {
    if (!route) return;
    setStarting(true);
    try {
      const r = await axiosClient.post(`/courier/route/${route.id}/start`);
      setRoute(r.data);
      flash("Маршрут взят в работу! Удачи!");
    } catch { flash("Ошибка при старте маршрута", true); }
    finally { setStarting(false); }
  };

  /* MARK POINT */
  const markPoint = async (pointId, status) => {
    setUpdating(pointId);
    try {
      const r = await axiosClient.patch(`/courier/route/points/${pointId}/status`, { status });
      setRoute(r.data);
      flash(`Точка отмечена как "${status}"`);
    } catch { flash("Ошибка", true); }
    finally { setUpdating(null); }
  };

  /* COMPLETE ROUTE */
  const completeRoute = async () => {
    if (!route) return;
    setCompleting(true);
    try {
      await axiosClient.post(`/courier/route/${route.id}/complete`, {
        actualDistanceKm: actualKm ? parseFloat(actualKm) : null,
      });
      flash("Маршрут успешно завершён!");
      setShowComplete(false);
      await loadRoute();
    } catch { flash("Ошибка при завершении", true); }
    finally { setCompleting(false); }
  };

  const flash = (text, err = false) => {
    setMsg({ text, err });
    setTimeout(() => setMsg(null), 4000);
  };

  const done    = (route?.points || []).filter(p => p.status === "Посещена").length;
  const total   = (route?.points || []).length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  const nextPoint = (route?.points || []).find((p) => p.status === "Ожидается");

  /* Курьер ещё не взял маршрут — показываем кнопку "Взять в работу" */
  const isNotStarted = route && route.status === "Активен" && !route.actualStartTime;
  const trafficMul = (() => { const h = new Date().getHours(); return (h>=7&&h<=9)||(h>=17&&h<=20)?1.35:1.0; })();

  if (loading) return (
    <CourierLayout>
      <div className="cr-root">
        <div className="cr-skels">{[1,2].map(i => <div key={i} className="cr-skel"/>)}</div>
      </div>
    </CourierLayout>
  );

  if (!route) return (
    <CourierLayout>
      <div className="cr-root">
        <div className="cr-empty">
          <i className="bx bx-map-alt"/>
          <h2>Нет активного маршрута</h2>
          <p>Ожидайте назначения от логиста. Вы получите уведомление.</p>
        </div>
      </div>
    </CourierLayout>
  );

  return (
    <CourierLayout>
      <div className="cr-root">

        {/* Header */}
        <div className="cr-hero">
          <div>
            <h1 className="cr-title">Маршрут #{route.id}</h1>
            <div className="cr-hero-meta">
              {route.vehicleModel && (
                <span><i className="bx bxs-truck"/> {route.vehicleModel} · {route.vehiclePlate}</span>
              )}
              {route.plannedStart && (
                <span><i className="bx bx-time"/> Старт: {fmtDateTime(route.plannedStart)}</span>
              )}
            </div>
          </div>

          <div className="cr-hero-actions">
            {/* Кнопка "Взять в работу" */}
            {isNotStarted && (
              <button className="cr-start-btn" onClick={handleStart} disabled={starting}>
                <i className="bx bx-play-circle"/>
                {starting ? "Запускаем..." : "Взять в работу"}
              </button>
            )}
            {/* Кнопка "Завершить" — только когда все точки отмечены */}
            {allDone && !isNotStarted && (
              <button className="cr-complete-btn" onClick={() => setShowComplete(true)}>
                <i className="bx bx-flag"/> Завершить маршрут
              </button>
            )}
          </div>
        </div>

        {msg && (
          <div className={`cr-msg ${msg.err ? "cr-msg--err" : "cr-msg--ok"}`}>
            <i className={`bx ${msg.err ? "bx-error-circle" : "bx-check-circle"}`}/> {msg.text}
          </div>
        )}

        {/* Weather */}
        {(weather || trafficMul > 1) && (
          <div className="cr-weather-bar">
            {weather && (
              <>
                <div className="cr-weather-item">
                  <i className={`bx ${weatherIcon(weather.weathercode)}`}/>
                  <span>{weatherLabel(weather.weathercode)}</span>
                </div>
                <div className="cr-weather-item">
                  <i className="bx bx-thermometer"/>
                  <span>{weather.temperature_2m?.toFixed(0)}°C</span>
                </div>
                <div className="cr-weather-item">
                  <i className="bx bx-wind"/>
                  <span>{weather.wind_speed_10m?.toFixed(0)} км/ч</span>
                </div>
              </>
            )}
            {trafficMul > 1 && (
              <div className="cr-weather-item cr-weather-item--traffic">
                <i className="bx bx-traffic-cone"/>
                <span>Час пик +{Math.round((trafficMul-1)*100)}%</span>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="cr-summary-grid">
          <div className="cr-summary-card">
            <span>Следующая точка</span>
            <strong>{nextPoint ? `#${nextPoint.sequenceNumber}` : "Маршрут завершён"}</strong>
            <p>{nextPoint?.address || "Все точки маршрутного листа уже обработаны."}</p>
          </div>
          <div className="cr-summary-card">
            <span>Метка курьера</span>
            <strong>{geoAllowed && courierPos ? "Онлайн" : "Ориентировочная"}</strong>
            <p>
              {geoAllowed && courierPos
                ? "На карте показана фактическая геопозиция курьера."
                : "Если геолокация недоступна, метка отображается по траектории маршрута."}
            </p>
          </div>
        </div>

        <div className="cr-progress-card">
          <div className="cr-progress-top">
            <span className="cr-progress-label">Прогресс маршрута</span>
            <span className="cr-progress-nums">{done}/{total} точек ({pct}%)</span>
          </div>
          <div className="cr-progress-bar"><div className="cr-progress-fill" style={{width:`${pct}%`}}/></div>
        </div>

        {/* Map */}
        <div className="cr-card cr-map-card">
          <div className="cr-card-title">
            <i className="bx bx-map"/> Карта маршрута
            {route.status === "Активен" && (
              <span className="cr-map-live"><span className="cr-live-dot"/>Машина движется</span>
            )}
          </div>
          <div className="cr-map-wrap">
            <div ref={mapRef} className="cr-map"/>
            {!mapReady && <div className="cr-map-loading"><div className="cr-spinner"/></div>}
          </div>
          <div className="cr-map-hint">
            <i className="bx bx-current-location"/>
            {geoAllowed && courierPos
              ? "Метка курьера обновляется по геолокации браузера."
              : "Для живой метки разрешите доступ к геолокации в браузере."}
          </div>
        </div>

        {/* Points */}
        <div className="cr-card">
          <div className="cr-card-title"><i className="bx bx-map-pin"/> Точки доставки</div>
          <div className="cr-points">

            <div className="cr-point cr-point--depot">
              <div className="cr-pt-dot cr-pt-dot--depot"><i className="bx bxs-home-circle"/></div>
              <div className="cr-pt-line cr-pt-line--done"/>
              <div className="cr-pt-info">
                <div className="cr-pt-label">Старт — Депо</div>
                <div className="cr-pt-addr">{DEPOT.label}</div>
                {route.plannedStart && (
                  <div className="cr-pt-time"><i className="bx bx-time"/> {fmtTime(route.plannedStart)}</div>
                )}
              </div>
            </div>

            {(route.points || []).map((p, i) => {
              const isDone = p.status === "Посещена";
              const isSkip = p.status === "Пропущена";
              const isWait = p.status === "Ожидается";
              const isLast = i === route.points.length - 1;

              return (
                <div key={p.id} className={`cr-point ${isDone?"cr-point--done":isSkip?"cr-point--skip":""}`}>
                  <div className={`cr-pt-dot ${isDone?"cr-pt-dot--done":isSkip?"cr-pt-dot--skip":"cr-pt-dot--wait"}`}>
                    {isDone && <i className="bx bx-check"/>}
                    {isSkip && <i className="bx bx-x"/>}
                    {isWait && <span>{p.sequenceNumber}</span>}
                  </div>
                  {!isLast && <div className={`cr-pt-line ${isDone?"cr-pt-line--done":""}`}/>}

                  <div className="cr-pt-info">
                    <div className="cr-pt-label">
                      Точка {p.sequenceNumber}
                      {p.orderId && <span className="cr-pt-order"> · Заказ #{p.orderId}</span>}
                    </div>
                    <div className="cr-pt-addr">{p.address}</div>

                    {(p.clientName || p.clientPhone) && (
                      <div className="cr-pt-client">
                        {p.clientName && <span><i className="bx bx-user"/> {p.clientName}</span>}
                        {p.clientPhone && (
                          <a href={`tel:${p.clientPhone}`} className="cr-pt-phone">
                            <i className="bx bx-phone"/> {p.clientPhone}
                          </a>
                        )}
                      </div>
                    )}

                    {p.plannedArrival && (
                      <div className="cr-pt-time">
                        <i className="bx bx-time"/> {fmtTime(p.plannedArrival)}
                      </div>
                    )}

                    {isWait && !isNotStarted && (
                      <div className="cr-pt-actions">
                        <button className="cr-pt-btn cr-pt-btn--deliver"
                          onClick={() => markPoint(p.id, "Посещена")}
                          disabled={updating === p.id}>
                          <i className="bx bx-check-circle"/>
                          {updating === p.id ? "..." : "Доставлен"}
                        </button>
                        <button className="cr-pt-btn cr-pt-btn--skip"
                          onClick={() => markPoint(p.id, "Пропущена")}
                          disabled={updating === p.id}>
                          <i className="bx bx-x-circle"/> Пропустить
                        </button>
                      </div>
                    )}

                    {isWait && isNotStarted && (
                      <div className="cr-pt-hint">
                        <i className="bx bx-info-circle"/> Нажмите «Взять в работу» чтобы начать отмечать точки
                      </div>
                    )}

                    {isDone && p.actualArrival && (
                      <div className="cr-pt-actual">
                        <i className="bx bx-check-circle"/> Прибыл в {fmtTime(p.actualArrival)}
                      </div>
                    )}
                    {isSkip && (
                      <div className="cr-pt-skipped"><i className="bx bx-x-circle"/> Пропущена</div>
                    )}
                  </div>
                </div>
              );
            })}

            {total > 0 && (
              <div className="cr-point cr-point--depot">
                <div className="cr-pt-dot cr-pt-dot--depot"><i className="bx bxs-home-circle"/></div>
                <div className="cr-pt-info">
                  <div className="cr-pt-label">Финиш — Возврат в Депо</div>
                  <div className="cr-pt-addr">{DEPOT.label}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Complete modal */}
        {showComplete && (
          <div className="cr-modal-overlay" onClick={() => setShowComplete(false)}>
            <div className="cr-modal" onClick={e => e.stopPropagation()}>
              <h2 className="cr-modal-title"><i className="bx bx-flag"/> Завершить маршрут</h2>
              <p className="cr-modal-sub">Все точки отмечены. Укажите фактический пробег.</p>
              <div className="cr-modal-field">
                <label>Пробег (км)</label>
                <input className="cr-modal-input" type="number" step="0.1" min="0"
                  placeholder="Например: 35.5"
                  value={actualKm} onChange={e => setActualKm(e.target.value)} />
              </div>
              <div className="cr-modal-actions">
                <button className="cr-modal-cancel" onClick={() => setShowComplete(false)}>Отмена</button>
                <button className="cr-modal-confirm" onClick={completeRoute} disabled={completing}>
                  <i className="bx bx-check"/> {completing ? "Завершаем..." : "Завершить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CourierLayout>
  );
}
