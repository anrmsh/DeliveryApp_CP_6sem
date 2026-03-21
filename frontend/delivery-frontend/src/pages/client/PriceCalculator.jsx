import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getRouteInfo, getWeather, geocodeAddress } from "../../api/clientApi";
import AddressInput from "../../components/client/AdressInput";
import "../../styles/client/PriceCalculator.css";

const VEHICLE_TYPES = [
  { id: "car",   label: "Легковой", maxKg: 200,  pricePerKm: 0.80, base: 3.50 },
  { id: "van",   label: "Фургон",   maxKg: 1500, pricePerKm: 1.40, base: 6.00 },
  { id: "truck", label: "Грузовик", maxKg: 5000, pricePerKm: 2.20, base: 10.00 },
];

const WEATHER_MULTIPLIERS = {
  0:1.0,1:1.0,2:1.0,3:1.0,45:1.15,48:1.2,51:1.1,53:1.1,55:1.15,
  61:1.15,63:1.2,65:1.25,71:1.3,73:1.35,75:1.4,80:1.15,81:1.2,82:1.3,95:1.4,96:1.45,99:1.5,
};

const WEATHER_NAMES = {
  0:"Ясно",1:"Преимущественно ясно",2:"Переменная облачность",3:"Пасмурно",
  45:"Туман",48:"Морозный туман",51:"Слабая морось",61:"Дождь",65:"Ливень",
  71:"Снег",75:"Сильный снег",80:"Ливень",95:"Гроза",99:"Гроза с градом",
};

function VehicleCard({ vt, selected, onClick }) {
  const SVGs = {
    car: (
      <svg width="60" height="34" viewBox="0 0 100 55" fill="none">
        <rect x="5" y="20" width="88" height="26" rx="6" fill="#0d9488"/>
        <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#0f766e"/>
        <rect x="36" y="9" width="26" height="11" rx="2" fill="#a7f3d0" opacity="0.75"/>
        <circle cx="24" cy="47" r="9" fill="#134e4a"/><circle cx="24" cy="47" r="4" fill="#6ee7b7"/>
        <circle cx="76" cy="47" r="9" fill="#134e4a"/><circle cx="76" cy="47" r="4" fill="#6ee7b7"/>
      </svg>
    ),
    van: (
      <svg width="60" height="36" viewBox="0 0 110 66" fill="none">
        <rect x="0" y="14" width="75" height="36" rx="4" fill="#0d9488"/>
        <rect x="75" y="20" width="28" height="30" rx="4" fill="#0f766e"/>
        <rect x="78" y="23" width="20" height="13" rx="2" fill="#a7f3d0" opacity="0.85"/>
        <circle cx="16" cy="54" r="10" fill="#134e4a"/><circle cx="16" cy="54" r="5" fill="#6ee7b7"/>
        <circle cx="90" cy="54" r="10" fill="#134e4a"/><circle cx="90" cy="54" r="5" fill="#6ee7b7"/>
      </svg>
    ),
    truck: (
      <svg width="60" height="34" viewBox="0 0 120 65" fill="none">
        <rect x="0" y="12" width="85" height="38" rx="4" fill="#0d9488"/>
        <rect x="85" y="18" width="30" height="32" rx="4" fill="#0f766e"/>
        <rect x="89" y="21" width="22" height="14" rx="2" fill="#a7f3d0" opacity="0.8"/>
        <circle cx="18" cy="53" r="10" fill="#134e4a"/><circle cx="18" cy="53" r="5" fill="#6ee7b7"/>
        <circle cx="55" cy="53" r="10" fill="#134e4a"/><circle cx="55" cy="53" r="5" fill="#6ee7b7"/>
        <circle cx="100" cy="53" r="10" fill="#134e4a"/><circle cx="100" cy="53" r="5" fill="#6ee7b7"/>
      </svg>
    ),
  };
  return (
    <button
      type="button"
      className={`pc-vcard ${selected ? "pc-vcard--active" : ""}`}
      onClick={onClick}
    >
      {SVGs[vt.id]}
      <div className="pc-vcard-label">{vt.label}</div>
      <div className="pc-vcard-info">до {vt.maxKg.toLocaleString()} кг</div>
      <div className="pc-vcard-price">{vt.pricePerKm} BYN/км</div>
    </button>
  );
}

export default function PriceCalculator() {
  const navigate = useNavigate();

  const [pickup,         setPickup]         = useState("");
  const [delivery,       setDelivery]       = useState("");
  const [pickupCoords,   setPickupCoords]   = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  const [vehicleType,    setVehicleType]    = useState("car");
  const [calc,           setCalc]           = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  const handleCalc = async () => {
    if (!pickup || !delivery) { setError("Введите оба адреса"); return; }
    setError(""); setLoading(true); setCalc(null);
    try {
      const from = pickupCoords   || await geocodeAddress(pickup);
      const to   = deliveryCoords || await geocodeAddress(delivery);
      if (!from || !to) { setError("Не удалось определить координаты"); setLoading(false); return; }

      const [route, weather] = await Promise.all([
        getRouteInfo(from, to),
        getWeather(from.lat, from.lng),
      ]);

      const vt          = VEHICLE_TYPES.find(v => v.id === vehicleType);
      const weatherMul  = WEATHER_MULTIPLIERS[weather?.weathercode] || 1.0;
      const h           = new Date().getHours();
      const trafficMul  = (h >= 7 && h <= 9) || (h >= 17 && h <= 20) ? 1.35 : 1.0;
      const price       = +(vt.base + route.distanceKm * vt.pricePerKm * weatherMul).toFixed(2);
      const totalMin    = Math.round(route.durationMin * weatherMul * trafficMul);

      setCalc({
        price, totalMin,
        distanceKm: +route.distanceKm.toFixed(1),
        weatherMul, trafficMul,
        weatherCode: weather?.weathercode,
        temperature: weather?.temperature,
        from, to,
      });
    } catch { setError("Ошибка расчёта. Проверьте адреса."); }
    finally { setLoading(false); }
  };

  /* Переход к оформлению с заполненными данными */
  const handleOrder = () => {
    const params = new URLSearchParams({
      pickup, delivery, vehicleType,
      ...(calc?.from ? { lat: calc.from.lat, lng: calc.from.lng } : {}),
      ...(calc?.to   ? { dlat: calc.to.lat,  dlng: calc.to.lng  } : {}),
      ...(calc ? { distanceKm: calc.distanceKm, weatherCode: calc.weatherCode ?? "" } : {}),
    });
    navigate(`/client/create?${params.toString()}`);
  };

  return (
    <ClientLayout>
      <div className="pc-root">

        <div className="pc-hero">
          <h1 className="pc-title"><i className="bx bx-calculator" /> Калькулятор</h1>
          <p className="pc-sub">Узнайте стоимость до оформления заказа</p>
        </div>

        <div className="pc-layout">
          {/* Form */}
          <div className="pc-form">
            <div className="pc-card">
              <div className="pc-card-title"><i className="bx bx-map" /> Адреса</div>
              <AddressInput
                label="Откуда"
                placeholder="г. Минск, пр-т Независимости, 32"
                value={pickup}
                onChange={setPickup}
                onSelect={(val, coords) => { setPickup(val); setPickupCoords(coords); }}
              />
              <AddressInput
                label="Куда"
                placeholder="г. Минск, ул. Немига, 5"
                value={delivery}
                onChange={setDelivery}
                onSelect={(val, coords) => { setDelivery(val); setDeliveryCoords(coords); }}
              />
            </div>

            <div className="pc-card">
              <div className="pc-card-title"><i className="bx bxs-truck" /> Транспорт</div>
              <div className="pc-vcards">
                {VEHICLE_TYPES.map(vt => (
                  <VehicleCard key={vt.id} vt={vt}
                    selected={vehicleType === vt.id}
                    onClick={() => setVehicleType(vt.id)} />
                ))}
              </div>
            </div>

            {error && <div className="pc-error"><i className="bx bx-error-circle" /> {error}</div>}

            <button className="pc-calc-btn" onClick={handleCalc} disabled={loading}>
              <i className={`bx ${loading ? "bx-loader-alt pc-spin" : "bx-calculator"}`} />
              {loading ? "Считаем..." : "Рассчитать стоимость"}
            </button>
          </div>

          {/* Result */}
          <div className="pc-result">
            {!calc && !loading && (
              <div className="pc-placeholder">
                <div className="pc-placeholder-icon"><i className="bx bx-calculator" /></div>
                <p>Введите адреса и нажмите<br />«Рассчитать стоимость»</p>
              </div>
            )}
            {loading && (
              <div className="pc-placeholder">
                <div className="pc-spinner" />
                <p>Запрашиваем маршрут, погоду<br />и данные о пробках...</p>
              </div>
            )}
            {calc && (
              <div className="pc-result-card">
                <div className="pc-result-label">Стоимость доставки</div>
                <div className="pc-result-price">{calc.price.toLocaleString()} BYN</div>
                <div className="pc-result-time">
                  <i className="bx bx-time" />
                  {calc.totalMin >= 60
                    ? `${Math.floor(calc.totalMin/60)} ч ${calc.totalMin%60} мин`
                    : `${calc.totalMin} мин`}
                </div>

                <div className="pc-result-divider" />

                <div className="pc-result-rows">
                  {[
                    { icon:"bx-ruler",       label:"Расстояние",  val:`${calc.distanceKm} км`                    },
                    { icon:"bx-thermometer", label:"Температура", val:`${calc.temperature?.toFixed(0) ?? "—"}°C` },
                    { icon:"bx-cloud",       label:"Погода",      val: WEATHER_NAMES[calc.weatherCode] || "—"    },
                    ...(calc.weatherMul > 1 ? [{ icon:"bx-cloud-rain",    label:"Коэф. погоды",  val:`×${calc.weatherMul.toFixed(2)}` }] : []),
                    ...(calc.trafficMul > 1 ? [{ icon:"bx-traffic-cone",  label:"Час пик",       val:`×${calc.trafficMul.toFixed(2)}`  }] : []),
                  ].map(r => (
                    <div key={r.label} className="pc-result-row">
                      <span><i className={`bx ${r.icon}`} /> {r.label}</span>
                      <strong>{r.val}</strong>
                    </div>
                  ))}
                </div>

                <button className="pc-order-btn" onClick={handleOrder}>
                  <i className="bx bx-send" /> Перейти к оформлению
                </button>
                <p className="pc-order-hint">Адреса будут автоматически заполнены</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}