import { useEffect, useState, useCallback } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/Notifications.css";

const MOCK_NOTIFS = [
  { id:1, title:"Заказ #42 назначен",    message:"Курьер принял ваш заказ и выехал.",             createdAt:new Date(Date.now()-1000*60*5).toISOString(),    statusNotification:0 },
  { id:2, title:"Задержка доставки",     message:"Из-за пробок время доставки увеличено на 20 мин.",createdAt:new Date(Date.now()-1000*60*40).toISOString(),  statusNotification:0 },
  { id:3, title:"Заказ #41 доставлен",   message:"Ваш заказ успешно доставлен.",                  createdAt:new Date(Date.now()-1000*3600*2).toISOString(),  statusNotification:1 },
  { id:4, title:"Заказ #40 создан",      message:"Логист назначит курьера в ближайшее время.",     createdAt:new Date(Date.now()-1000*3600*24).toISOString(), statusNotification:1 },
];

function NotifIcon({ title = "" }) {
  const t = title.toLowerCase();
  if (t.includes("задержк")) return <i className="bx bx-time-five notif-icon notif-icon--warn" />;
  if (t.includes("доставлен")) return <i className="bx bx-check-circle notif-icon notif-icon--success" />;
  if (t.includes("назначен")) return <i className="bx bxs-truck notif-icon notif-icon--info" />;
  if (t.includes("отменён") || t.includes("отменен")) return <i className="bx bx-x-circle notif-icon notif-icon--danger" />;
  if (t.includes("создан")) return <i className="bx bx-package notif-icon notif-icon--blue" />;
  return <i className="bx bx-bell notif-icon notif-icon--muted" />;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const normalized = typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")
    ? dateStr + "Z" : dateStr;
  const diff = (Date.now() - new Date(normalized)) / 1000;
  if (diff < 60)    return "только что";
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(normalized).toLocaleDateString("ru-RU", { day:"numeric", month:"short" });
}

const isRead = n => n.statusNotification === 1 || n.read === true;

function NotifCard({ n, onRead, onDismiss }) {
  const read = isRead(n);
  return (
    <div className={`notif-card ${!read ? "notif-card--unread" : ""}`}
      onClick={() => !read && onRead(n.id)}>
      <div className="notif-card-icon-wrap">
        <NotifIcon title={n.title} />
      </div>
      <div className="notif-card-body">
        <div className="notif-card-title">{n.title}</div>
        <div className="notif-card-msg">{n.message}</div>
        <div className="notif-card-time">
          <i className="bx bx-time" /> {timeAgo(n.createdAt)}
        </div>
      </div>
      {!read && <div className="notif-unread-dot" />}
      {/* Кнопка закрыть */}
      <button className="notif-dismiss" onClick={e => { e.stopPropagation(); onDismiss(n.id); }}
        title="Скрыть уведомление">
        <i className="bx bx-x" />
      </button>
    </div>
  );
}

const LIMIT = 10;

export default function Notifications() {
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [useMock,  setUseMock]  = useState(false);
  const [showAll,  setShowAll]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await axiosClient.get("/client/notifications");
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setNotifs(list);
      setUseMock(false);
    } catch {
      setNotifs(MOCK_NOTIFS);
      setUseMock(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const unreadCount = notifs.filter(n => !isRead(n)).length;

  /* Показываем только 10 по умолчанию */
  const displayNotifs = showAll ? notifs : notifs.slice(0, LIMIT);
  const hasMore = notifs.length > LIMIT;

  const markOne = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, statusNotification:1 } : n));
    if (!useMock) axiosClient.patch(`/client/notifications/${id}/read`).catch(() => {});
  };

  const markAll = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, statusNotification:1 })));
    if (!useMock) axiosClient.patch("/client/notifications/read-all").catch(() => {});
  };

  /* Скрыть (dismiss) — убирает из списка локально */
  const dismiss = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (!useMock) axiosClient.patch(`/client/notifications/${id}/read`).catch(() => {});
  };

  const unread = displayNotifs.filter(n => !isRead(n));
  const read   = displayNotifs.filter(n => isRead(n));

  return (
    <ClientLayout>
      <div className="notif-root">

        <div className="notif-hero">
          <div>
            <h1 className="notif-title">
              <i className="bx bx-bell" /> Уведомления
              {unreadCount > 0 && <span className="notif-count">{unreadCount}</span>}
            </h1>
            <p className="notif-sub">Изменения статусов, задержки и системные сообщения</p>
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

        {useMock && (
          <div className="notif-mock-banner">
            <i className="bx bx-info-circle" /> Показаны тестовые уведомления
          </div>
        )}

        {loading && (
          <div className="notif-skels">
            {[1,2,3,4].map(i => <div key={i} className="notif-skel" />)}
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="notif-empty">
            <i className="bx bx-bell-off" />
            <p>Уведомлений пока нет</p>
            <span>Здесь будут появляться изменения статусов ваших заказов</span>
          </div>
        )}

        {!loading && notifs.length > 0 && (
          <>
            {unread.length > 0 && (
              <div className="notif-section">
                <div className="notif-section-label">
                  <i className="bx bx-radio-circle-marked" /> Новые
                </div>
                <div className="notif-list">
                  {unread.map(n => (
                    <NotifCard key={n.id} n={n} onRead={markOne} onDismiss={dismiss} />
                  ))}
                </div>
              </div>
            )}

            {read.length > 0 && (
              <div className="notif-section">
                {unread.length > 0 && (
                  <div className="notif-section-label notif-section-label--muted">
                    <i className="bx bx-check" /> Прочитанные
                  </div>
                )}
                <div className="notif-list">
                  {read.map(n => (
                    <NotifCard key={n.id} n={n} onRead={markOne} onDismiss={dismiss} />
                  ))}
                </div>
              </div>
            )}

            {/* Показать больше / свернуть */}
            {hasMore && (
              <div className="notif-show-more">
                <button className="notif-show-more-btn" onClick={() => setShowAll(s => !s)}>
                  {showAll
                    ? <><i className="bx bx-chevron-up" /> Свернуть</>
                    : <><i className="bx bx-chevron-down" /> Показать ещё ({notifs.length - LIMIT})</>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}