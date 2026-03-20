// ═══════════════════════════════════════════════════════════════════
// CreateRoute.jsx  —  src/pages/logist/CreateRoute.jsx
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/CreateRoute.css";

export default function CreateRoute() {
  const navigate = useNavigate();

  const [couriers,  setCouriers]  = useState([]);
  const [vehicles,  setVehicles]  = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    courierId:    "",
    vehicleId:    "",
    plannedStart: "",
    plannedEnd:   "",
    orderIds:     [],
  });

  useEffect(() => {
    (async () => {
      try {
        const [c, v, o] = await Promise.all([
          axiosClient.get("/logist/couriers"),
          axiosClient.get("/logist/vehicles?status=Доступен"),
          axiosClient.get("/logist/orders"),
        ]);
        setCouriers(Array.isArray(c.data) ? c.data : []);
        setVehicles(Array.isArray(v.data) ? v.data : []);
        setOrders((Array.isArray(o.data) ? o.data : [])
          .filter(ord => ord.status === "Создан"));
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const toggleOrder = (id) => {
    setForm(p => ({
      ...p,
      orderIds: p.orderIds.includes(id)
        ? p.orderIds.filter(x => x !== id)
        : [...p.orderIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.courierId || !form.vehicleId) {
      setError("Выберите курьера и автомобиль"); return;
    }
    setSaving(true); setError("");
    try {
      await axiosClient.post("/logist/routes", {
        courierId:    Number(form.courierId),
        vehicleId:    Number(form.vehicleId),
        plannedStart: form.plannedStart || null,
        plannedEnd:   form.plannedEnd   || null,
        orderIds:     form.orderIds,
      });
      navigate("/logist/routes");
    } catch {
      setError("Ошибка при создании маршрута");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <LogistLayout>
      <div className="cr-root">
        <div className="cr-skels">
          {[1,2,3].map(i => <div key={i} className="cr-skel" />)}
        </div>
      </div>
    </LogistLayout>
  );

  return (
    <LogistLayout>
      <div className="cr-root">
        <div className="cr-hero">
          <button className="cr-back" onClick={() => navigate("/logist/routes")}>
            <i className="bx bx-arrow-back" /> Назад
          </button>
          <h1 className="cr-title">Новый маршрут</h1>
          <p className="cr-sub">Назначьте курьера, автомобиль и выберите заказы</p>
        </div>

        {error && (
          <div className="cr-error">
            <i className="bx bx-error-circle" /> {error}
          </div>
        )}

        <div className="cr-grid">

          {/* LEFT: Route config */}
          <div className="cr-col">

            {/* Courier */}
            <div className="cr-card">
              <div className="cr-card-title">
                <i className="bx bx-user" /> Курьер
              </div>
              <div className="cr-courier-list">
                {couriers.map(c => (
                  <div
                    key={c.id}
                    className={`cr-courier-item ${form.courierId == c.id ? "cr-courier-item--active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, courierId: c.id }))}
                  >
                    <div className="cr-courier-avatar">
                      {c.fullName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <div className="cr-courier-info">
                      <div className="cr-courier-name">{c.fullName}</div>
                      <div className="cr-courier-phone">{c.phone || c.email}</div>
                    </div>
                    {form.courierId == c.id && <i className="bx bx-check-circle cr-courier-check" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle */}
            <div className="cr-card">
              <div className="cr-card-title">
                <i className="bx bxs-truck" /> Автомобиль
              </div>
              <div className="cr-vehicle-grid">
                {vehicles.map(v => (
                  <div
                    key={v.id}
                    className={`cr-vehicle-card ${form.vehicleId == v.id ? "cr-vehicle-card--active" : ""}`}
                    onClick={() => setForm(p => ({ ...p, vehicleId: v.id }))}
                  >
                    <VehicleIcon capacityKg={v.capacityKg} />
                    <div className="cr-vehicle-model">{v.model}</div>
                    <div className="cr-vehicle-plate">{v.plateNumber}</div>
                    <div className="cr-vehicle-cap">
                      <i className="bx bx-package" /> {v.capacityKg} кг
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="cr-card">
              <div className="cr-card-title">
                <i className="bx bx-time" /> Время
              </div>
              <div className="cr-time-row">
                <div className="cr-field">
                  <label>Начало</label>
                  <input className="cr-input" type="datetime-local"
                    value={form.plannedStart}
                    onChange={e => setForm(p => ({ ...p, plannedStart: e.target.value }))} />
                </div>
                <div className="cr-field">
                  <label>Конец</label>
                  <input className="cr-input" type="datetime-local"
                    value={form.plannedEnd}
                    onChange={e => setForm(p => ({ ...p, plannedEnd: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Orders */}
          <div className="cr-col">
            <div className="cr-card cr-orders-card">
              <div className="cr-card-title">
                <i className="bx bx-list-check" /> Заказы
                {form.orderIds.length > 0 && (
                  <span className="cr-orders-count">{form.orderIds.length} выбрано</span>
                )}
              </div>
              {orders.length === 0 ? (
                <div className="cr-empty">
                  <i className="bx bx-package" />
                  <p>Нет заказов ожидающих назначения</p>
                </div>
              ) : (
                <div className="cr-orders-list">
                  {orders.map(o => (
                    <div
                      key={o.id}
                      className={`cr-order-item ${form.orderIds.includes(o.id) ? "cr-order-item--selected" : ""}`}
                      onClick={() => toggleOrder(o.id)}
                    >
                      <div className={`cr-checkbox ${form.orderIds.includes(o.id) ? "cr-checkbox--on" : ""}`}>
                        {form.orderIds.includes(o.id) && <i className="bx bx-check" />}
                      </div>
                      <div className="cr-order-info">
                        <div className="cr-order-id">Заказ #{o.id}</div>
                        <div className="cr-order-from">
                          <i className="bx bx-map" /> {o.pickupAddress}
                        </div>
                        <div className="cr-order-to">
                          <i className="bx bxs-map" /> {o.deliveryAddress}
                        </div>
                        {o.clientName && (
                          <div className="cr-order-client">
                            <i className="bx bx-user" /> {o.clientName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="cr-footer">
          <button className="cr-cancel-btn" onClick={() => navigate("/logist/routes")}>
            Отмена
          </button>
          <button className="cr-submit-btn" onClick={handleSubmit} disabled={saving}>
            <i className="bx bx-save" />
            {saving ? "Создаём..." : "Создать маршрут"}
          </button>
        </div>
      </div>
    </LogistLayout>
  );
}

/* SVG vehicle icon based on capacity */
function VehicleIcon({ capacityKg }) {
  const kg = Number(capacityKg) || 0;
  if (kg >= 3000) return (
    <svg width="72" height="40" viewBox="0 0 120 65" fill="none">
      <rect x="0" y="12" width="85" height="38" rx="4" fill="#3b82f6"/>
      <rect x="85" y="18" width="30" height="32" rx="4" fill="#2563eb"/>
      <rect x="89" y="21" width="22" height="14" rx="2" fill="#bfdbfe" opacity="0.8"/>
      <circle cx="18" cy="53" r="10" fill="#1e3a8a"/><circle cx="18" cy="53" r="5" fill="#93c5fd"/>
      <circle cx="55" cy="53" r="10" fill="#1e3a8a"/><circle cx="55" cy="53" r="5" fill="#93c5fd"/>
      <circle cx="100" cy="53" r="10" fill="#1e3a8a"/><circle cx="100" cy="53" r="5" fill="#93c5fd"/>
    </svg>
  );
  if (kg >= 1000) return (
    <svg width="72" height="40" viewBox="0 0 110 66" fill="none">
      <rect x="0" y="14" width="75" height="36" rx="4" fill="#6366f1"/>
      <rect x="75" y="20" width="28" height="30" rx="4" fill="#4f46e5"/>
      <rect x="78" y="23" width="20" height="13" rx="2" fill="#c7d2fe" opacity="0.85"/>
      <circle cx="16" cy="54" r="10" fill="#1e1b4b"/><circle cx="16" cy="54" r="5" fill="#a5b4fc"/>
      <circle cx="90" cy="54" r="10" fill="#1e1b4b"/><circle cx="90" cy="54" r="5" fill="#a5b4fc"/>
    </svg>
  );
  return (
    <svg width="72" height="40" viewBox="0 0 100 55" fill="none">
      <rect x="5" y="20" width="88" height="26" rx="6" fill="#0ea5e9"/>
      <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#0284c7"/>
      <path d="M63 8 Q78 8 83 20 L65 20Z" fill="#bae6fd" opacity="0.85"/>
      <path d="M22 8 Q28 8 35 20 L20 20Z" fill="#bae6fd" opacity="0.85"/>
      <rect x="36" y="9" width="26" height="11" rx="2" fill="#bae6fd" opacity="0.75"/>
      <circle cx="24" cy="47" r="9" fill="#0c4a6e"/><circle cx="24" cy="47" r="4" fill="#7dd3fc"/>
      <circle cx="76" cy="47" r="9" fill="#0c4a6e"/><circle cx="76" cy="47" r="4" fill="#7dd3fc"/>
    </svg>
  );
}




