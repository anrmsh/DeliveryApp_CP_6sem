import { useEffect, useState, useCallback } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/Notifications.css";

/* ── Fallback mock data (пока бэк не готов) ── */
const MOCK_NOTIFS = [
  {
    id: 1,
    title: "Заказ #42 назначен",
    message: "Курьер Иван П. принял ваш заказ и выехал на точку отправки.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    statusNotification: 0,
  },
  {
    id: 2,
    title: "Задержка доставки",
    message: "Из-за пробок время доставки увеличено на 20 минут.",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    statusNotification: 0,
  },
  {
    id: 3,
    title: "Заказ #41 доставлен",
    message: "Ваш заказ успешно доставлен. Не забудьте оценить курьера!",
    createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    statusNotification: 1,
  },
  {
    id: 4,
    title: "Заказ #40 создан",
    message: "Ваша заявка принята. Логист назначит курьера в ближайшее время.",
    createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    statusNotification: 1,
  },
];

/* ── Icon by title ── */
function NotifIcon({ title = "" }) {
  const t = title.toLowerCase();
  if (t.includes("задержк"))
    return <i className="bx bx-time-five notif-icon notif-icon--warn" />;
  if (t.includes("доставлен"))
    return <i className="bx bx-check-circle notif-icon notif-icon--success" />;
  if (t.includes("назначен"))
    return <i className="bx bxs-truck notif-icon notif-icon--info" />;
  if (t.includes("отменён") || t.includes("отменен"))
    return <i className="bx bx-x-circle notif-icon notif-icon--danger" />;
  if (t.includes("создан"))
    return <i className="bx bx-package notif-icon notif-icon--blue" />;
  if (t.includes("погод") || t.includes("пробк"))
    return <i className="bx bx-cloud-rain notif-icon notif-icon--warn" />;
  return <i className="bx bx-bell notif-icon notif-icon--muted" />;
}

/* ── Time ago ── */
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "только что";
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

const isRead = (n) => n.statusNotification === 1 || n.read === true;

/* ── Single card ── */
function NotifCard({ n, onRead }) {
  const read = isRead(n);
  return (
    <div
      className={`notif-card ${!read ? "notif-card--unread" : ""}`}
      onClick={() => !read && onRead(n.id)}
    >
      <div className="notif-card-icon-wrap">
        <NotifIcon title={n.title} />
      </div>
      <div className="notif-card-body">
        <div className="notif-card-title">{n.title}</div>
        <div className="notif-card-msg">{n.message}</div>
        <div className="notif-card-time">
          <i className="bx bx-time" />
          {timeAgo(n.createdAt)}
        </div>
      </div>
      {!read && <div className="notif-unread-dot" />}
    </div>
  );
}

/* ── Main component ── */
export default function Notifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [useMock, setUseMock] = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await axiosClient.get("/client/notifications");
      const data = res.data;
      const list = Array.isArray(data) ? data : data.content || [];
      setNotifs(list);
      setUseMock(false);
      setError(false);
    } catch {
      /* Бэк не готов — используем моки чтобы страница не была пустой */
      setNotifs(MOCK_NOTIFS);
      setUseMock(true);
      setError(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const unreadCount = notifs.filter((n) => !isRead(n)).length;

  /* Mark one read */
  const markOne = async (id) => {
    setNotifs((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, statusNotification: 1, read: true } : n
      )
    );
    if (!useMock) {
      await axiosClient
        .patch(`/client/notifications/${id}/read`)
        .catch(() => {});
    }
  };

  /* Mark all read */
  const markAll = async () => {
    setNotifs((prev) =>
      prev.map((n) => ({ ...n, statusNotification: 1, read: true }))
    );
    if (!useMock) {
      await axiosClient.patch("/client/notifications/read-all").catch(() => {});
    }
  };

  const unreadList = notifs.filter((n) => !isRead(n));
  const readList   = notifs.filter((n) => isRead(n));

  return (
    <ClientLayout>
      <div className="notif-root">

        {/* HEADER */}
        <div className="notif-hero">
          <div>
            <h1 className="notif-title">
              <i className="bx bx-bell" />
              Уведомления
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount}</span>
              )}
            </h1>
            <p className="notif-sub">
              Изменения статусов, задержки и системные сообщения
            </p>
          </div>
          <div className="notif-hero-actions">
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAll}>
                <i className="bx bx-check-double" /> Прочитать все
              </button>
            )}
            <button className="notif-refresh" onClick={load} title="Обновить">
              <i className="bx bx-refresh" />
            </button>
          </div>
        </div>

        {/* Mock banner */}
        {useMock && (
          <div className="notif-mock-banner">
            <i className="bx bx-info-circle" />
            Показаны тестовые уведомления — бэкенд недоступен
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="notif-skels">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="notif-skel" />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && notifs.length === 0 && (
          <div className="notif-empty">
            <i className="bx bx-bell-off" />
            <p>Уведомлений пока нет</p>
            <span>Здесь будут появляться изменения статусов ваших заказов</span>
          </div>
        )}

        {/* LIST */}
        {!loading && notifs.length > 0 && (
          <>
            {unreadList.length > 0 && (
              <div className="notif-section">
                <div className="notif-section-label">
                  <i className="bx bx-radio-circle-marked" /> Новые
                </div>
                <div className="notif-list">
                  {unreadList.map((n) => (
                    <NotifCard key={n.id} n={n} onRead={markOne} />
                  ))}
                </div>
              </div>
            )}

            {readList.length > 0 && (
              <div className="notif-section">
                {unreadList.length > 0 && (
                  <div className="notif-section-label notif-section-label--muted">
                    <i className="bx bx-check" /> Прочитанные
                  </div>
                )}
                <div className="notif-list">
                  {readList.map((n) => (
                    <NotifCard key={n.id} n={n} onRead={markOne} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </ClientLayout>
  );
}