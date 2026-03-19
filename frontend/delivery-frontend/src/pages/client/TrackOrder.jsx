import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "../../components/layout/ClientLayout";
import { getOrders } from "../../api/clientApi";
import { VehicleSVG } from "./LandingPage";
import "../../styles/client/TrackOrder.css";

const STATUSES = ["Создан", "Назначен", "В процессе", "Доставлен"];

function StatusProgress({ status }) {
  const idx = STATUSES.indexOf(status);
  if (status === "Отменён") return (
    <div className="to-cancelled">❌ Заказ отменён</div>
  );

  return (
    <div className="to-progress">
      {STATUSES.map((s, i) => (
        <div key={s} className="to-step-wrap">
          <div className={`to-step ${i <= idx ? "to-step--done" : ""} ${i === idx ? "to-step--active" : ""}`}>
            <div className="to-step-circle">
              {i < idx ? "✓" : i === idx ? <span className="to-pulse" /> : i + 1}
            </div>
            <div className="to-step-label">{s}</div>
          </div>
          {i < STATUSES.length - 1 && (
            <div className={`to-connector ${i < idx ? "to-connector--done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function RouteVisual({ order }) {
  const status = order?.status;
  const pct =
    status === "Создан"     ? 0   :
    status === "Назначен"   ? 15  :
    status === "В процессе" ? 55  :
    status === "Доставлен"  ? 100 : 0;

  return (
    <div className="to-route">
      <div className="to-route-inner">
        {/* FROM */}
        <div className="to-route-stop to-route-stop--from">
          <div className="to-route-dot to-route-dot--from">A</div>
          <div className="to-route-addr">{order?.pickupAddress || "Точка отправки"}</div>
        </div>

        {/* TRACK */}
        <div className="to-track-wrap">
          <div className="to-track-bg">
            <div className="to-track-fill" style={{ width: `${pct}%` }} />
          </div>
          {/* dashes */}
          <div className="to-dashes">
            {[...Array(12)].map((_, i) => (
              <div key={i} className={`to-dash ${i / 12 * 100 <= pct ? "to-dash--done" : ""}`} />
            ))}
          </div>
          {/* car */}
          <div
            className="to-car"
            style={{ left: `calc(${pct}% - 28px)`, opacity: pct > 0 && pct < 100 ? 1 : 0 }}
          >
            <VehicleSVG type="car" size={56} />
            {pct > 0 && pct < 100 && <div className="to-car-pulse" />}
          </div>
        </div>

        {/* TO */}
        <div className="to-route-stop to-route-stop--to">
          <div className="to-route-dot to-route-dot--to">Б</div>
          <div className="to-route-addr">{order?.deliveryAddress || "Точка доставки"}</div>
        </div>
      </div>

      {pct > 0 && pct < 100 && (
        <div className="to-eta">
          🚗 Курьер в пути · ориентировочно ещё {Math.round((100 - pct) * 0.3)} мин
        </div>
      )}
      {pct === 100 && (
        <div className="to-delivered">✅ Заказ доставлен!</div>
      )}
    </div>
  );
}

export default function TrackOrder() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrders();
        const list = Array.isArray(data) ? data : data.content || [];
        const active = list.filter(o => ["Назначен","В процессе","Создан"].includes(o.status));
        setOrders(list);
        if (active.length > 0) setSelected(active[0]);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const activeOrders = orders.filter(o => ["Создан","Назначен","В процессе"].includes(o.status));

  return (
    <ClientLayout>
      <div className="to-root">
        <div className="to-hero">
          <h1 className="to-title">Отслеживание заказа</h1>
          <p className="to-sub">Следите за статусом доставки в режиме реального времени</p>
        </div>

        {loading ? (
          <div className="to-skel-wrap">
            {[1,2].map(i => <div key={i} className="to-skel" />)}
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="to-empty">
            <span>📭</span>
            <p>Нет активных заказов для отслеживания</p>
            <button className="to-new-btn" onClick={() => navigate("/client/create")}>
              Создать заказ
            </button>
          </div>
        ) : (
          <div className="to-grid">
            {/* Order selector */}
            <div className="to-panel">
              <div className="to-panel-title">Активные заказы</div>
              <div className="to-order-list">
                {activeOrders.map(o => (
                  <div
                    key={o.id}
                    className={`to-order-item ${selected?.id === o.id ? "to-order-item--active" : ""}`}
                    onClick={() => setSelected(o)}
                  >
                    <div className="to-order-item-id">Заказ #{o.id}</div>
                    <div className="to-order-item-addr">{o.deliveryAddress}</div>
                    <div className="to-order-item-status">{o.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main track */}
            <div className="to-main">
              {selected ? (
                <>
                  <div className="to-panel">
                    <div className="to-panel-title">Маршрут заказа #{selected.id}</div>
                    <RouteVisual order={selected} />
                  </div>
                  <div className="to-panel">
                    <div className="to-panel-title">Прогресс доставки</div>
                    <StatusProgress status={selected.status} />
                  </div>
                  <div className="to-panel">
                    <div className="to-panel-title">Детали заказа</div>
                    <div className="to-details">
                      <div className="to-detail-row"><span>№ заказа</span><strong>#{selected.id}</strong></div>
                      <div className="to-detail-row"><span>Статус</span><strong>{selected.status}</strong></div>
                      <div className="to-detail-row"><span>Откуда</span><strong>{selected.pickupAddress}</strong></div>
                      <div className="to-detail-row"><span>Куда</span><strong>{selected.deliveryAddress}</strong></div>
                      {selected.requestedTime && (
                        <div className="to-detail-row">
                          <span>Плановое время</span>
                          <strong>{new Date(selected.requestedTime).toLocaleString("ru-RU")}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="to-empty">Выберите заказ слева</div>
              )}
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  );
}