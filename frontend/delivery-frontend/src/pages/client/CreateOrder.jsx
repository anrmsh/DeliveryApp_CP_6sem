import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";   // ← добавлен useSearchParams
import ClientLayout from "../../components/layout/ClientLayout";
import { createOrder, getRouteInfo, getWeather, geocodeAddress } from "../../api/clientApi";
import AddressInput from "../../components/client/AdressInput";
import "../../styles/client/CreateOrder.css";

const VEHICLE_TYPES = [
  { id: "car",   label: "Легковой", maxKg: 200,  pricePerKm: 0.80, base: 3.50 },
  { id: "van",   label: "Фургон",   maxKg: 1500, pricePerKm: 1.40, base: 6.00 },
  { id: "truck", label: "Грузовик", maxKg: 5000, pricePerKm: 2.20, base: 10.00 },
];

const WEATHER_MULTIPLIERS = {
  0:1.0, 1:1.0, 2:1.0, 3:1.0,
  45:1.15, 48:1.2, 51:1.1, 53:1.1, 55:1.15,
  61:1.15, 63:1.2, 65:1.25, 71:1.3, 73:1.35, 75:1.4,
  80:1.15, 81:1.2, 82:1.3, 95:1.4, 96:1.45, 99:1.5,
};

const WEATHER_NAMES = {
  0:"Ясно", 1:"Преимущественно ясно", 2:"Переменная облачность", 3:"Пасмурно",
  45:"Туман", 48:"Морозный туман",
  51:"Слабая морось", 53:"Морось", 55:"Сильная морось",
  61:"Слабый дождь", 63:"Умеренный дождь", 65:"Ливень",
  71:"Слабый снег", 73:"Умеренный снег", 75:"Сильный снег",
  80:"Небольшой ливень", 81:"Ливень", 82:"Сильный ливень",
  95:"Гроза", 96:"Гроза с градом", 99:"Гроза с крупным градом",
};

function VehicleSVG({ type = "car", size = 70 }) {
  if (type === "truck") return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 65" fill="none">
      <rect x="0" y="12" width="85" height="38" rx="4" fill="#0d9488"/>
      <rect x="85" y="18" width="30" height="32" rx="4" fill="#0f766e"/>
      <rect x="89" y="21" width="22" height="14" rx="2" fill="#a7f3d0" opacity="0.8"/>
      <circle cx="18" cy="53" r="10" fill="#134e4a"/><circle cx="18" cy="53" r="5" fill="#6ee7b7"/>
      <circle cx="55" cy="53" r="10" fill="#134e4a"/><circle cx="55" cy="53" r="5" fill="#6ee7b7"/>
      <circle cx="100" cy="53" r="10" fill="#134e4a"/><circle cx="100" cy="53" r="5" fill="#6ee7b7"/>
    </svg>
  );
  if (type === "van") return (
    <svg width={size} height={size * 0.6} viewBox="0 0 110 66" fill="none">
      <rect x="0" y="14" width="75" height="36" rx="4" fill="#7c3aed"/>
      <rect x="75" y="20" width="28" height="30" rx="4" fill="#6d28d9"/>
      <rect x="78" y="23" width="20" height="13" rx="2" fill="#ddd6fe" opacity="0.85"/>
      <circle cx="16" cy="54" r="10" fill="#1e1b4b"/><circle cx="16" cy="54" r="5" fill="#a78bfa"/>
      <circle cx="90" cy="54" r="10" fill="#1e1b4b"/><circle cx="90" cy="54" r="5" fill="#a78bfa"/>
    </svg>
  );
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none">
      <rect x="5" y="20" width="88" height="26" rx="6" fill="#16a34a"/>
      <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#15803d"/>
      <rect x="36" y="9" width="26" height="11" rx="2" fill="#bbf7d0" opacity="0.75"/>
      <circle cx="24" cy="47" r="9" fill="#134e4a"/><circle cx="24" cy="47" r="4" fill="#6ee7b7"/>
      <circle cx="76" cy="47" r="9" fill="#134e4a"/><circle cx="76" cy="47" r="4" fill="#6ee7b7"/>
    </svg>
  );
}

function toISOForSpring(val) {
  if (!val) return null;
  if (val.length === 16) return val + ":00";
  return val;
}

function fmtDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();   // ← теперь работает

  const [form, setForm] = useState({
    pickupAddress:   searchParams.get("pickup")      || "",
    deliveryAddress: searchParams.get("delivery")    || "",
    requestedTime:   "",
    weightKg:        "",
    lengthCm:        "",
    widthCm:         "",
    heightCm:        "",
    vehicleType:     searchParams.get("vehicleType") || "car",
    comment:         "",
  });

  const [pickupCoords, setPickupCoords] = useState(
    searchParams.get("lat") && searchParams.get("lng")
      ? { lat: parseFloat(searchParams.get("lat")), lng: parseFloat(searchParams.get("lng")) }
      : null
  );
  const [deliveryCoords, setDeliveryCoords] = useState(
    searchParams.get("dlat") && searchParams.get("dlng")
      ? { lat: parseFloat(searchParams.get("dlat")), lng: parseFloat(searchParams.get("dlng")) }
      : null
  );

  const [calc,       setCalc]     = useState(null);
  const [calcLoading,setCL]       = useState(false);
  const [calcError,  setCE]       = useState("");
  const [submitting, setSub]      = useState(false);
  const [success,    setSuccess]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleCalculate = async () => {
    if (!form.pickupAddress || !form.deliveryAddress) { setCE("Введите оба адреса"); return; }
    setCE(""); setCL(true); setCalc(null);
    try {
      const fromCoords = pickupCoords   || await geocodeAddress(form.pickupAddress);
      const toCoords   = deliveryCoords || await geocodeAddress(form.deliveryAddress);
      if (!fromCoords || !toCoords) { setCE("Не удалось определить координаты."); setCL(false); return; }

      const [route, weather] = await Promise.all([
        getRouteInfo(fromCoords, toCoords),
        getWeather(fromCoords.lat, fromCoords.lng),
      ]);
      const vt         = VEHICLE_TYPES.find(v => v.id === form.vehicleType);
      const weatherMul = WEATHER_MULTIPLIERS[weather?.weathercode] || 1.0;
      const hour       = new Date().getHours();
      const trafficMul = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20) ? 1.35 : 1.0;
      const totalMin   = Math.round(route.durationMin * weatherMul * trafficMul);
      const price      = +(vt.base + route.distanceKm * vt.pricePerKm * weatherMul).toFixed(2);
      setCalc({ distanceKm: route.distanceKm.toFixed(1), baseMin: Math.round(route.durationMin),
        totalMin, price, weatherCode: weather?.weathercode, temperature: weather?.temperature,
        weatherMul, trafficMul, vehicleType: vt, fromCoords, toCoords });
    } catch { setCE("Ошибка при расчёте. Проверьте адреса."); }
    finally { setCL(false); }
  };

  const handleSubmit = async () => {
    if (!form.pickupAddress || !form.deliveryAddress) return;
    setSub(true);
    try {
      await createOrder({
        pickupAddress:     form.pickupAddress,
        deliveryAddress:   form.deliveryAddress,
        requestedTime:     toISOForSpring(form.requestedTime),
        latitude:          calc?.fromCoords?.lat ?? pickupCoords?.lat ?? null,
        longitude:         calc?.fromCoords?.lng ?? pickupCoords?.lng ?? null,
        deliveryLatitude:  calc?.toCoords?.lat   ?? deliveryCoords?.lat ?? null,
        deliveryLongitude: calc?.toCoords?.lng   ?? deliveryCoords?.lng ?? null,
        distanceKm:        calc ? parseFloat(calc.distanceKm) : null,
        weatherCode:       calc?.weatherCode ?? null,
        vehicleType:       form.vehicleType,
        weightKg:  form.weightKg  ? parseFloat(form.weightKg)  : null,
        lengthCm:  form.lengthCm  ? parseFloat(form.lengthCm)  : null,
        widthCm:   form.widthCm   ? parseFloat(form.widthCm)   : null,
        heightCm:  form.heightCm  ? parseFloat(form.heightCm)  : null,
        comment:   form.comment   || null,
      });
      setSuccess(true);
      setTimeout(() => navigate("/client/orders"), 2000);
    } catch { setCE("Ошибка при создании заказа"); }
    finally { setSub(false); }
  };

  if (success) return (
    <ClientLayout>
      <div className="co-root">
        <div className="co-success">
          <div className="co-success-icon"><i className="bx bx-check-circle" /></div>
          <h2>Заказ успешно создан!</h2>
          <p>Перенаправляем в историю заказов...</p>
        </div>
      </div>
    </ClientLayout>
  );

  return (
    <ClientLayout>
      <div className="co-root">
        <div className="co-hero">
          <h1 className="co-title"><i className="bx bx-package" /> Новый заказ</h1>
          <p className="co-sub">Заполните форму — система рассчитает стоимость с учётом пробок и погоды</p>
        </div>

        <div className="co-grid">
          <div className="co-form-col">
            <div className="co-card">
              <div className="co-card-title"><i className="bx bx-map" /> Адреса</div>
              <AddressInput label="Адрес отправки" placeholder="г. Минск, ул. Ленина, 10"
                value={form.pickupAddress} onChange={val => set("pickupAddress", val)}
                onSelect={(val, coords) => { set("pickupAddress", val); setPickupCoords(coords); }} />
              <AddressInput label="Адрес доставки" placeholder="г. Минск, ул. Немига, 5"
                value={form.deliveryAddress} onChange={val => set("deliveryAddress", val)}
                onSelect={(val, coords) => { set("deliveryAddress", val); setDeliveryCoords(coords); }} />
              <div className="co-field">
                <label>Желаемое время доставки</label>
                <input className="co-input" type="datetime-local" value={form.requestedTime}
                  onChange={e => set("requestedTime", e.target.value)} />
                {form.requestedTime && (
                  <div className="co-date-preview">
                    <i className="bx bx-calendar-check" />
                    {fmtDateTime(toISOForSpring(form.requestedTime))}
                  </div>
                )}
              </div>
            </div>

            <div className="co-card">
              <div className="co-card-title"><i className="bx bx-box" /> Параметры груза</div>
              <div className="co-row">
                <div className="co-field"><label>Вес (кг)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.weightKg} onChange={e => set("weightKg", e.target.value)} /></div>
                <div className="co-field"><label>Длина (см)</label>
                  <input className="co-input" type="number" placeholder="100"
                    value={form.lengthCm} onChange={e => set("lengthCm", e.target.value)} /></div>
              </div>
              <div className="co-row">
                <div className="co-field"><label>Ширина (см)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.widthCm} onChange={e => set("widthCm", e.target.value)} /></div>
                <div className="co-field"><label>Высота (см)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.heightCm} onChange={e => set("heightCm", e.target.value)} /></div>
              </div>
              <div className="co-field"><label>Комментарий</label>
                <textarea className="co-input co-textarea" placeholder="Хрупкий груз..."
                  value={form.comment} onChange={e => set("comment", e.target.value)} /></div>
            </div>

            <div className="co-card">
              <div className="co-card-title"><i className="bx bxs-car" /> Тип транспорта</div>
              <div className="co-vehicles">
                {VEHICLE_TYPES.map(vt => (
                  <button key={vt.id}
                    className={`co-vehicle-btn ${form.vehicleType === vt.id ? "co-vehicle-btn--active" : ""}`}
                    onClick={() => set("vehicleType", vt.id)}>
                    <VehicleSVG type={vt.id} size={70} />
                    <div className="co-vehicle-label">{vt.label}</div>
                    <div className="co-vehicle-info">до {vt.maxKg.toLocaleString()} кг</div>
                    <div className="co-vehicle-price">{vt.pricePerKm} BYN/км</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="co-actions">
              <button className="co-calc-btn" onClick={handleCalculate} disabled={calcLoading}>
                <i className="bx bx-calculator" />
                {calcLoading ? "Рассчитываем..." : "Рассчитать стоимость"}
              </button>
              <button className="co-submit-btn" onClick={handleSubmit}
                disabled={submitting || !form.pickupAddress || !form.deliveryAddress}>
                <i className="bx bx-send" />
                {submitting ? "Создаём заказ..." : "Создать заказ"}
              </button>
            </div>

            {calcError && <div className="co-error"><i className="bx bx-error-circle" /> {calcError}</div>}
          </div>

          {/* Result — sticky чтобы всегда было видно */}
          <div className="co-result-col">
            {!calc && !calcLoading && (
              <div className="co-result-placeholder">
                <i className="bx bx-calculator co-placeholder-icon" />
                <p>Заполните адреса и нажмите<br />«Рассчитать стоимость»</p>
              </div>
            )}
            {calcLoading && (
              <div className="co-result-placeholder">
                <div className="co-spinner" />
                <p>Запрашиваем данные о маршруте,<br />погоде и пробках...</p>
              </div>
            )}
            {calc && (
              <div className="co-result-card">
                <div className="co-result-title"><i className="bx bx-receipt" /> Расчёт доставки</div>
                <div className="co-result-main">
                  <div className="co-result-price">{calc.price.toLocaleString()} BYN</div>
                  <div className="co-result-time">
                    <i className="bx bx-time" />
                    {calc.totalMin >= 60
                      ? `${Math.floor(calc.totalMin/60)} ч ${calc.totalMin % 60} мин`
                      : `${calc.totalMin} мин`}
                  </div>
                </div>
                <div className="co-result-divider" />
                <div className="co-result-rows">
                  {[
                    { icon:"bx-ruler",       label:"Расстояние",    val:`${calc.distanceKm} км`             },
                    { icon:"bxs-car",        label:"Транспорт",     val:calc.vehicleType.label              },
                    { icon:"bx-time-five",   label:"Базовое время", val:`${calc.baseMin} мин`               },
                    { icon:"bx-thermometer", label:"Температура",   val:`${calc.temperature ?? "—"}°C`      },
                    { icon:"bx-cloud",       label:"Погода",        val:WEATHER_NAMES[calc.weatherCode]||"—"},
                    ...(calc.weatherMul > 1 ? [{ icon:"bx-cloud-rain",   label:"Коэф. погоды", val:`×${calc.weatherMul.toFixed(2)}` }] : []),
                    ...(calc.trafficMul > 1 ? [{ icon:"bx-traffic-cone", label:"Час пик",      val:`×${calc.trafficMul.toFixed(2)}` }] : []),
                  ].map(r => (
                    <div key={r.label} className="co-result-row">
                      <span><i className={`bx ${r.icon}`} /> {r.label}</span>
                      <strong>{r.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}