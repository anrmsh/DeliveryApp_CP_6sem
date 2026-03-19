import { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/Notifications.css";

const MOCK_NOTIFS = [
  { id: 1, title: "Заказ #42 назначен", message: "Курьер Иван П. принял ваш заказ и выехал на точку отправки.", createdAt: new Date(Date.now() - 1000*60*5).toISOString(),  read: false },
  { id: 2, title: "Задержка доставки",  message: "Из-за пробок на Садовом кольце время доставки увеличено на 20 минут.", createdAt: new Date(Date.now() - 1000*60*40).toISOString(), read: false },
  { id: 3, title: "Заказ #41 доставлен", message: "Ваш заказ успешно доставлен. Не забудьте оценить курьера!", createdAt: new Date(Date.now() - 1000*3600*2).toISOString(), read: true  },
  { id: 4, title: "Заказ #40 создан",   message: "Ваша заявка принята. Логист назначит курьера в ближайшее время.", createdAt: new Date(Date.now() - 1000*3600*24).toISOString(), read: true  },
];

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)        return "только что";
  if (diff < 3600)      return `${Math.floor(diff/60)} мин назад`;
  if (diff < 86400)     return `${Math.floor(diff/3600)} ч назад`;
  return `${Math.floor(diff/86400)} д назад`;
}

export default function Notifications() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [loading, setLoading] = useState(false);

  const unread = notifs.filter(n => !n.read).length;

  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const markOne = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  return (
    <ClientLayout>
      <div className="notif-root">
        <div className="notif-hero">
          <div>
            <h1 className="notif-title">
              Уведомления
              {unread > 0 && <span className="notif-count">{unread}</span>}
            </h1>
            <p className="notif-sub">Здесь отображаются изменения статусов и задержки</p>
          </div>
          {unread > 0 && (
            <button className="notif-mark-all" onClick={markAll}>
              ✓ Отметить все прочитанными
            </button>
          )}
        </div>

        {notifs.length === 0 ? (
          <div className="notif-empty">
            <span>🔔</span>
            <p>Нет уведомлений</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifs.map(n => (
              <div
                key={n.id}
                className={`notif-card ${!n.read ? "notif-card--unread" : ""}`}
                onClick={() => markOne(n.id)}
              >
                <div className="notif-card-icon">
                  {n.title.includes("задержка") || n.title.includes("Задержка") ? "⚠️" :
                   n.title.includes("доставлен") ? "✅" :
                   n.title.includes("назначен")  ? "🚚" : "📦"}
                </div>
                <div className="notif-card-body">
                  <div className="notif-card-title">{n.title}</div>
                  <div className="notif-card-msg">{n.message}</div>
                  <div className="notif-card-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}