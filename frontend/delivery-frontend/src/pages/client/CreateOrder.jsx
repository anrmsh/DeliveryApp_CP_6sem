import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { createOrder, getRouteInfo, getWeather, geocodeAddress } from "../../api/clientApi";
import AddressInput from "../../components/client/AdressInput";
import "../../styles/client/CreateOrder.css";

/* ── Vehicle types ── */
const VEHICLE_TYPES = [
  { id: "car",   label: "Легковой",  icon: "bx bxs-car",       maxKg: 200,  pricePerKm: 25 },
  { id: "van",   label: "Фургон",    icon: "bx bxs-truck",      maxKg: 1500, pricePerKm: 45 },
  { id: "truck", label: "Грузовик",  icon: "bx bx-car",         maxKg: 5000, pricePerKm: 80 },
];

/* ── Weather codes → multiplier ── */
const WEATHER_MULTIPLIERS = {
  0:1.0, 1:1.0, 2:1.0, 3:1.0,
  45:1.15, 48:1.2,
  51:1.1, 53:1.1, 55:1.15,
  61:1.15, 63:1.2, 65:1.25,
  71:1.3, 73:1.35, 75:1.4,
  80:1.15, 81:1.2, 82:1.3,
  95:1.4, 96:1.45, 99:1.5,
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

/* ── SVG vehicles ── */
function VehicleSVG({ type = "car", size = 70 }) {
  if (type === "truck") return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 65" fill="none">
      <rect x="0" y="12" width="85" height="38" rx="4" fill="#0d9488"/>
      <rect x="85" y="18" width="30" height="32" rx="4" fill="#0f766e"/>
      <rect x="89" y="21" width="22" height="14" rx="2" fill="#a7f3d0" opacity="0.8"/>
      <circle cx="18" cy="53" r="10" fill="#134e4a"/><circle cx="18" cy="53" r="5" fill="#6ee7b7"/>
      <circle cx="55" cy="53" r="10" fill="#134e4a"/><circle cx="55" cy="53" r="5" fill="#6ee7b7"/>
      <circle cx="100" cy="53" r="10" fill="#134e4a"/><circle cx="100" cy="53" r="5" fill="#6ee7b7"/>
      <rect x="112" y="28" width="6" height="6" rx="2" fill="#fbbf24"/>
    </svg>
  );
  if (type === "van") return (
    <svg width={size} height={size * 0.6} viewBox="0 0 110 66" fill="none">
      <rect x="0" y="14" width="75" height="36" rx="4" fill="#7c3aed"/>
      <rect x="75" y="20" width="28" height="30" rx="4" fill="#6d28d9"/>
      <rect x="78" y="23" width="20" height="13" rx="2" fill="#ddd6fe" opacity="0.85"/>
      <circle cx="16" cy="54" r="10" fill="#1e1b4b"/><circle cx="16" cy="54" r="5" fill="#a78bfa"/>
      <circle cx="90" cy="54" r="10" fill="#1e1b4b"/><circle cx="90" cy="54" r="5" fill="#a78bfa"/>
      <rect x="100" y="30" width="6" height="6" rx="2" fill="#fbbf24"/>
    </svg>
  );
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none">
      <rect x="5" y="20" width="88" height="26" rx="6" fill="#16a34a"/>
      <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#15803d"/>
      <path d="M63 8 Q78 8 83 20 L65 20Z" fill="#bbf7d0" opacity="0.85"/>
      <path d="M22 8 Q28 8 35 20 L20 20Z" fill="#bbf7d0" opacity="0.85"/>
      <rect x="36" y="9" width="26" height="11" rx="2" fill="#bbf7d0" opacity="0.75"/>
      <circle cx="24" cy="47" r="9" fill="#134e4a"/><circle cx="24" cy="47" r="4" fill="#6ee7b7"/>
      <circle cx="76" cy="47" r="9" fill="#134e4a"/><circle cx="76" cy="47" r="4" fill="#6ee7b7"/>
      <rect x="90" y="26" width="7" height="5" rx="2" fill="#fef08a"/>
      <rect x="3" y="26" width="5" height="5" rx="2" fill="#fca5a5"/>
    </svg>
  );
}

export default function CreateOrder() {
  const navigate = useNavigate();

  /* ── Form state ── */
  const [form, setForm] = useState({
    pickupAddress:   "",
    deliveryAddress: "",
    requestedTime:   "",
    weightKg:        "",
    lengthCm:        "",
    widthCm:         "",
    heightCm:        "",
    vehicleType:     "car",
    comment:         "",
  });

  /* ── Coordinates from AddressInput autocomplete ── */
  const [pickupCoords,   setPickupCoords]   = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);

  /* ── Calculator state ── */
  const [calc,       setCalc]      = useState(null);
  const [calcLoading, setCL]       = useState(false);
  const [calcError,   setCE]       = useState("");
  const [submitting,  setSub]      = useState(false);
  const [success,     setSuccess]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  /* ── Calculate price ── */
  const handleCalculate = async () => {
    if (!form.pickupAddress || !form.deliveryAddress) {
      setCE("Введите оба адреса"); return;
    }
    setCE(""); setCL(true); setCalc(null);
    try {
      // Use coords from autocomplete if available, otherwise geocode
      const fromCoords = pickupCoords   || await geocodeAddress(form.pickupAddress);
      const toCoords   = deliveryCoords || await geocodeAddress(form.deliveryAddress);

      if (!fromCoords || !toCoords) {
        setCE("Не удалось определить координаты. Уточните адрес."); setCL(false); return;
      }

      const [route, weather] = await Promise.all([
        getRouteInfo(fromCoords, toCoords),
        getWeather(fromCoords.lat, fromCoords.lng),
      ]);

      const vt          = VEHICLE_TYPES.find(v => v.id === form.vehicleType);
      const weatherMul  = WEATHER_MULTIPLIERS[weather?.weathercode] || 1.0;
      const hour        = new Date().getHours();
      const trafficMul  = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20) ? 1.35 : 1.0;
      const totalMin    = Math.round(route.durationMin * weatherMul * trafficMul);
      const price       = Math.round(route.distanceKm * vt.pricePerKm * weatherMul);

      setCalc({
        distanceKm:  route.distanceKm.toFixed(1),
        baseMin:     Math.round(route.durationMin),
        totalMin,
        price,
        weatherCode: weather?.weathercode,
        temperature: weather?.temperature,
        windspeed:   weather?.windspeed,
        weatherMul,
        trafficMul,
        vehicleType: vt,
        fromCoords,
        toCoords,
      });
    } catch {
      setCE("Ошибка при расчёте. Проверьте адреса.");
    } finally { setCL(false); }
  };

  /* ── Submit order ── */
  const handleSubmit = async () => {
    if (!form.pickupAddress || !form.deliveryAddress) return;
    setSub(true);
    try {
      await createOrder({
        pickupAddress:      form.pickupAddress,
        deliveryAddress:    form.deliveryAddress,
        requestedTime:      form.requestedTime || null,
        latitude:           calc?.fromCoords?.lat ?? pickupCoords?.lat ?? null,
        longitude:          calc?.fromCoords?.lng ?? pickupCoords?.lng ?? null,
        deliveryLatitude:   calc?.toCoords?.lat   ?? deliveryCoords?.lat ?? null,
        deliveryLongitude:  calc?.toCoords?.lng   ?? deliveryCoords?.lng ?? null,
        distanceKm:         calc ? parseFloat(calc.distanceKm) : null,
        weatherCode:        calc?.weatherCode ?? null,
        vehicleType:        form.vehicleType,
        weightKg:           form.weightKg   ? parseFloat(form.weightKg)  : null,
        lengthCm:           form.lengthCm   ? parseFloat(form.lengthCm)  : null,
        widthCm:            form.widthCm    ? parseFloat(form.widthCm)   : null,
        heightCm:           form.heightCm   ? parseFloat(form.heightCm)  : null,
        comment:            form.comment    || null,
      });
      setSuccess(true);
      setTimeout(() => navigate("/client/orders"), 2000);
    } catch {
      setCE("Ошибка при создании заказа");
    } finally { setSub(false); }
  };

  /* ── Success screen ── */
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
          <h1 className="co-title">
            <i className="bx bx-package" /> Новый заказ
          </h1>
          <p className="co-sub">Заполните форму — система рассчитает стоимость с учётом пробок и погоды</p>
        </div>

        <div className="co-grid">

          {/* ── FORM ── */}
          <div className="co-form-col">

            {/* Addresses */}
            <div className="co-card">
              <div className="co-card-title">
                <i className="bx bx-map" /> Адреса
              </div>

              <AddressInput
                label="Адрес отправки"
                placeholder="ул. Ленина, 10, Москва"
                value={form.pickupAddress}
                onChange={(val) => set("pickupAddress", val)}
                onSelect={(val, coords) => {
                  set("pickupAddress", val);
                  setPickupCoords(coords);
                }}
              />

              <AddressInput
                label="Адрес доставки"
                placeholder="ул. Тверская, 5, Москва"
                value={form.deliveryAddress}
                onChange={(val) => set("deliveryAddress", val)}
                onSelect={(val, coords) => {
                  set("deliveryAddress", val);
                  setDeliveryCoords(coords);
                }}
              />

              <div className="co-field">
                <label>Желаемое время доставки</label>
                <input
                  className="co-input"
                  type="datetime-local"
                  value={form.requestedTime}
                  onChange={e => set("requestedTime", e.target.value)}
                />
              </div>
            </div>

            {/* Cargo */}
            <div className="co-card">
              <div className="co-card-title">
                <i className="bx bx-box" /> Параметры груза
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Вес (кг)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.weightKg} onChange={e => set("weightKg", e.target.value)} />
                </div>
                <div className="co-field">
                  <label>Длина (см)</label>
                  <input className="co-input" type="number" placeholder="100"
                    value={form.lengthCm} onChange={e => set("lengthCm", e.target.value)} />
                </div>
              </div>
              <div className="co-row">
                <div className="co-field">
                  <label>Ширина (см)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.widthCm} onChange={e => set("widthCm", e.target.value)} />
                </div>
                <div className="co-field">
                  <label>Высота (см)</label>
                  <input className="co-input" type="number" placeholder="50"
                    value={form.heightCm} onChange={e => set("heightCm", e.target.value)} />
                </div>
              </div>
              <div className="co-field">
                <label>Комментарий</label>
                <textarea
                  className="co-input co-textarea"
                  placeholder="Хрупкий груз, требует аккуратного обращения..."
                  value={form.comment}
                  onChange={e => set("comment", e.target.value)}
                />
              </div>
            </div>

            {/* Vehicle */}
            <div className="co-card">
              <div className="co-card-title">
                <i className="bx bxs-car" /> Тип транспорта
              </div>
              <div className="co-vehicles">
                {VEHICLE_TYPES.map(vt => (
                  <button
                    key={vt.id}
                    className={`co-vehicle-btn ${form.vehicleType === vt.id ? "co-vehicle-btn--active" : ""}`}
                    onClick={() => set("vehicleType", vt.id)}
                  >
                    <VehicleSVG type={vt.id} size={70} />
                    <div className="co-vehicle-label">{vt.label}</div>
                    <div className="co-vehicle-info">до {vt.maxKg.toLocaleString()} кг</div>
                    <div className="co-vehicle-price">{vt.pricePerKm} ₽/км</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="co-actions">
              <button className="co-calc-btn" onClick={handleCalculate} disabled={calcLoading}>
                <i className="bx bx-calculator" />
                {calcLoading ? "Рассчитываем..." : "Рассчитать стоимость"}
              </button>
              <button
                className="co-submit-btn"
                onClick={handleSubmit}
                disabled={submitting || !form.pickupAddress || !form.deliveryAddress}
              >
                <i className="bx bx-send" />
                {submitting ? "Создаём заказ..." : "Создать заказ"}
              </button>
            </div>

            {calcError && (
              <div className="co-error">
                <i className="bx bx-error-circle" /> {calcError}
              </div>
            )}
          </div>

          {/* ── RESULT ── */}
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
                <div className="co-result-title">
                  <i className="bx bx-receipt" /> Расчёт доставки
                </div>

                <div className="co-result-main">
                  <div className="co-result-price">{calc.price.toLocaleString()} ₽</div>
                  <div className="co-result-time">
                    <i className="bx bx-time" />
                    {calc.totalMin >= 60
                      ? `${Math.floor(calc.totalMin/60)} ч ${calc.totalMin % 60} мин`
                      : `${calc.totalMin} мин`}
                  </div>
                </div>

                <div className="co-result-divider" />

                <div className="co-result-rows">
                  <div className="co-result-row">
                    <span><i className="bx bx-ruler" /> Расстояние</span>
                    <strong>{calc.distanceKm} км</strong>
                  </div>
                  <div className="co-result-row">
                    <span><i className="bx bxs-car" /> Транспорт</span>
                    <strong>{calc.vehicleType.label}</strong>
                  </div>
                  <div className="co-result-row">
                    <span><i className="bx bx-time-five" /> Базовое время</span>
                    <strong>{calc.baseMin} мин</strong>
                  </div>
                  <div className="co-result-row">
                    <span><i className="bx bx-thermometer" /> Температура</span>
                    <strong>{calc.temperature}°C</strong>
                  </div>
                  <div className="co-result-row">
                    <span><i className="bx bx-cloud" /> Погода</span>
                    <strong>{WEATHER_NAMES[calc.weatherCode] || "—"}</strong>
                  </div>
                  {calc.weatherMul > 1.0 && (
                    <div className="co-result-row co-result-row--warn">
                      <span><i className="bx bx-cloud-rain" /> Коэф. погоды</span>
                      <strong>×{calc.weatherMul.toFixed(2)}</strong>
                    </div>
                  )}
                  {calc.trafficMul > 1.0 && (
                    <div className="co-result-row co-result-row--warn">
                      <span><i className="bx bx-traffic-cone" /> Час пик</span>
                      <strong>×{calc.trafficMul.toFixed(2)}</strong>
                    </div>
                  )}
                </div>

                {(calc.weatherMul > 1.0 || calc.trafficMul > 1.0) && (
                  <div className="co-result-notice">
                    <i className="bx bx-info-circle" /> Время увеличено из-за{" "}
                    {calc.trafficMul > 1.0 ? "час пика" : ""}
                    {calc.weatherMul > 1.0 && calc.trafficMul > 1.0 ? " и " : ""}
                    {calc.weatherMul > 1.0 ? "неблагоприятной погоды" : ""}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </ClientLayout>
  );
}