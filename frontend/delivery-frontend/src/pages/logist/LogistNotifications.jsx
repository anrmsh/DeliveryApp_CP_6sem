import { useCallback, useEffect, useMemo, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import {
  getLogistNotifications,
  markAllLogistNotificationsRead,
  markLogistNotificationRead,
} from "../../api/logistApi";
import { fmtDateShort } from "../../utils/dateUtils";
import "../../styles/logist/LogistNotifications.css";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const normalized = typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")
    ? `${dateStr}Z`
    : dateStr;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "только что";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
  return fmtDateShort(dateStr);
}

function iconByTitle(title = "") {
  const value = title.toLowerCase();
  if (value.includes("маршрут")) return "bx-map-alt";
  if (value.includes("заказ")) return "bx-package";
  if (value.includes("проб")) return "bx-traffic-cone";
  return "bx-bell";
}

export default function LogistNotifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const data = await getLogistNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, [load]);

  const unreadCount = useMemo(() => items.filter((item) => item.statusNotification === 0).length, [items]);

  const handleRead = async (id) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, statusNotification: 1 } : item));
    try {
      await markLogistNotificationRead(id);
    } catch {}
  };

  const handleReadAll = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, statusNotification: 1 })));
    try {
      await markAllLogistNotificationsRead();
    } catch {}
  };

  return (
    <LogistLayout>
      <div className="lgn-root">
        <div className="lgn-hero">
          <div>
            <h1>Уведомления логиста</h1>
            <p>Здесь собраны новые маршрутные события, системные сообщения и изменения по доставкам.</p>
          </div>
          <div className="lgn-actions">
            {unreadCount > 0 && (
              <button className="lgn-btn lgn-btn--primary" onClick={handleReadAll}>
                <i className="bx bx-check-double" />
                Прочитать все
              </button>
            )}
            <button className="lgn-btn" onClick={() => load(true)} disabled={refreshing}>
              <i className={`bx ${refreshing ? "bx-loader-alt" : "bx-refresh"}`} />
              Обновить
            </button>
          </div>
        </div>

        <div className="lgn-stats">
          <div className="lgn-stat">
            <span className="lgn-stat__label">Всего</span>
            <strong>{items.length}</strong>
          </div>
          <div className="lgn-stat">
            <span className="lgn-stat__label">Новых</span>
            <strong>{unreadCount}</strong>
          </div>
        </div>

        {loading ? (
          <div className="lgn-list">{[1, 2, 3].map((item) => <div key={item} className="lgn-skeleton" />)}</div>
        ) : items.length === 0 ? (
          <div className="lgn-empty">
            <i className="bx bx-bell-off" />
            <h2>Пока пусто</h2>
            <p>Когда в системе появятся важные события для логиста, они отобразятся здесь.</p>
          </div>
        ) : (
          <div className="lgn-list">
            {items.map((item) => {
              const isUnread = item.statusNotification === 0;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`lgn-card ${isUnread ? "lgn-card--unread" : ""}`}
                  onClick={() => isUnread && handleRead(item.id)}
                >
                  <div className="lgn-card__icon">
                    <i className={`bx ${iconByTitle(item.title)}`} />
                  </div>
                  <div className="lgn-card__body">
                    <div className="lgn-card__top">
                      <h3>{item.title || "Уведомление"}</h3>
                      <span>{timeAgo(item.createdAt)}</span>
                    </div>
                    <p>{item.message || "Без описания"}</p>
                  </div>
                  {isUnread && <span className="lgn-card__badge">Новое</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}
