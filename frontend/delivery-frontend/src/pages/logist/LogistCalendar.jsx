import { useEffect, useMemo, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import { getRoutes } from "../../api/logistApi";
import { fmtDateTime } from "../../utils/dateUtils";
import "../../styles/logist/LogistCalendar.css";

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getRouteDate(route) {
  const value = route.plannedStart || route.createdAt || route.plannedEnd;
  if (!value) return null;
  const normalized = typeof value === "string" && !value.endsWith("Z") && !value.includes("+")
    ? `${value}Z`
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildCalendar(baseDate) {
  const first = startOfMonth(baseDate);
  const start = new Date(first);
  const day = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - day);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

export default function LogistCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [routes, setRoutes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoutes()
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false));
  }, []);

  const routesByDay = useMemo(() => {
    return routes.reduce((acc, route) => {
      const routeDate = getRouteDate(route);
      if (!routeDate) return acc;
      const key = routeDate.toISOString().slice(0, 10);
      acc[key] = acc[key] || [];
      acc[key].push(route);
      return acc;
    }, {});
  }, [routes]);

  const days = useMemo(() => buildCalendar(currentMonth), [currentMonth]);
  const selectedKey = selectedDate.toISOString().slice(0, 10);
  const dayRoutes = routesByDay[selectedKey] || [];

  return (
    <LogistLayout>
      <div className="lgcal-root">
        <div className="lgcal-hero">
          <div>
            <h1 className="lgcal-title">Календарь маршрутов</h1>
            <p className="lgcal-sub">Таблица по дням месяца с назначенными маршрутами и деталями доставки.</p>
          </div>
          <div className="lgcal-nav">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
              <i className="bx bx-chevron-left" />
            </button>
            <div className="lgcal-month">
              {currentMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
            </div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
              <i className="bx bx-chevron-right" />
            </button>
          </div>
        </div>

        <div className="lgcal-layout">
          <div className="lgcal-table-card">
            <table className="lgcal-table">
              <thead>
                <tr>
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                    <th key={day}>{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5].map((week) => (
                  <tr key={week}>
                    {days.slice(week * 7, week * 7 + 7).map((day) => {
                      const key = day.toISOString().slice(0, 10);
                      const items = routesByDay[key] || [];
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isSelected = key === selectedKey;
                      return (
                        <td key={key}>
                          <button
                            type="button"
                            className={`lgcal-day ${isCurrentMonth ? "" : "lgcal-day--muted"} ${items.length ? "lgcal-day--busy" : "lgcal-day--free"} ${isSelected ? "lgcal-day--selected" : ""}`}
                            onClick={() => setSelectedDate(day)}
                          >
                            <span className="lgcal-day-num">{day.getDate()}</span>
                            {items.length > 0 && (
                              <span className="lgcal-day-status">{items.length} маршрут(а)</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="lgcal-side-card">
            <div className="lgcal-side-title">{selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</div>
            {loading ? (
              <div className="lgcal-empty">Загрузка маршрутов...</div>
            ) : dayRoutes.length === 0 ? (
              <div className="lgcal-empty">На выбранный день маршруты не запланированы.</div>
            ) : (
              <div className="lgcal-routes">
                {dayRoutes.map((route) => (
                  <article key={route.id} className="lgcal-route-card">
                    <div className="lgcal-route-head">
                      <strong>Маршрут #{route.id}</strong>
                      <span>{route.status}</span>
                    </div>
                    <div className="lgcal-route-line">Курьер: {route.courierName || "Не назначен"}</div>
                    <div className="lgcal-route-line">Точек доставки: {route.points?.length || 0}</div>
                    <div className="lgcal-route-line">Старт: {fmtDateTime(route.plannedStart)}</div>
                    <div className="lgcal-points">
                      {(route.points || []).map((point) => (
                        <div key={point.id} className="lgcal-point-item">
                          <span className="lgcal-point-num">{point.sequenceNumber}</span>
                          <span>{point.address}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </LogistLayout>
  );
}
