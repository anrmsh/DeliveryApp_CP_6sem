
import { useEffect, useState } from "react";
import CourierLayout from "../../components/layout/CourierLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/courier/CourierProfile.css";

export default function CourierProfile() {
  const [profile,  setProfile]  = useState(null);
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("info"); // info | notifs

  useEffect(() => {
    Promise.all([
      axiosClient.get("/courier/profile"),
      axiosClient.get("/courier/notifications"),
    ])
      .then(([p, n]) => {
        setProfile(p.data);
        setNotifs(Array.isArray(n.data) ? n.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markAll = async () => {
    await axiosClient.patch("/courier/notifications/read-all").catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, statusNotification: 1 })));
  };

  const unread = notifs.filter(n => n.statusNotification === 0).length;

  if (loading) return (
    <CourierLayout>
      <div className="cp-root">
        <div className="cp-skels">{[1,2].map(i => <div key={i} className="cp-skel"/>)}</div>
      </div>
    </CourierLayout>
  );

  return (
    <CourierLayout>
      <div className="cp-root">

        {/* Hero */}
        <div className="cp-hero">
          <div className="cp-avatar">
            {profile?.fullName?.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="cp-name">{profile?.fullName || "—"}</h1>
            <div className="cp-email"><i className="bx bx-envelope"/> {profile?.email}</div>
            <div className="cp-badges">
              <span className="cp-role-badge"><i className="bx bx-car"/> Курьер</span>
              {profile?.status === "Активен"
                ? <span className="cp-status cp-status--active"><span className="cp-dot"/>{profile.status}</span>
                : <span className="cp-status cp-status--blocked"><span className="cp-dot"/>{profile?.status}</span>}
            </div>
          </div>
          {/* Rating */}
          {profile?.totalRatings > 0 && (
            <div className="cp-rating-block">
              <div className="cp-rating-num">{profile.averageRating.toFixed(1)}</div>
              <div className="cp-stars">
                {[1,2,3,4,5].map(i => (
                  <i key={i} className={`bx ${i <= Math.round(profile.averageRating) ? "bxs-star" : "bx-star"}`}/>
                ))}
              </div>
              <div className="cp-rating-total">{profile.totalRatings} отзывов</div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="cp-tabs">
          <button className={`cp-tab ${tab === "info" ? "cp-tab--active" : ""}`} onClick={() => setTab("info")}>
            <i className="bx bx-user"/> Данные
          </button>
          <button className={`cp-tab ${tab === "notifs" ? "cp-tab--active" : ""}`} onClick={() => setTab("notifs")}>
            <i className="bx bx-bell"/> Уведомления
            {unread > 0 && <span className="cp-notif-dot">{unread}</span>}
          </button>
        </div>

        {/* Info tab */}
        {tab === "info" && (
          <div className="cp-card">
            <div className="cp-card-title"><i className="bx bx-id-card"/> Личные данные</div>
            {[
              { icon: "bx-user",     label: "ФИО",       val: profile?.fullName },
              { icon: "bx-envelope", label: "Email",     val: profile?.email },
              { icon: "bx-phone",    label: "Телефон",   val: profile?.phone },
              { icon: "bx-calendar", label: "С нами с",  val: profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})
                  : "—" },
            ].map(f => (
              <div key={f.label} className="cp-field">
                <div className="cp-field-label"><i className={`bx ${f.icon}`}/> {f.label}</div>
                <div className="cp-field-val">{f.val || <span className="cp-empty">Не указано</span>}</div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications tab */}
        {tab === "notifs" && (
          <div className="cp-card">
            <div className="cp-card-title">
              <i className="bx bx-bell"/> Уведомления
              {unread > 0 && (
                <button className="cp-mark-all" onClick={markAll}>
                  <i className="bx bx-check-double"/> Прочитать все
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <div className="cp-notifs-empty">
                <i className="bx bx-bell-off"/> Нет уведомлений
              </div>
            ) : (
              <div className="cp-notifs">
                {notifs.map(n => (
                  <div key={n.id} className={`cp-notif ${n.statusNotification === 0 ? "cp-notif--unread" : ""}`}>
                    <div className="cp-notif-left">
                      {n.statusNotification === 0 && <span className="cp-notif-badge"/>}
                      <i className={`bx ${n.title?.includes("маршрут") ? "bx-map-alt" : n.title?.includes("доставлен") ? "bx-check-circle" : "bx-bell"}`}/>
                    </div>
                    <div className="cp-notif-body">
                      <div className="cp-notif-title">{n.title}</div>
                      <div className="cp-notif-msg">{n.message}</div>
                      {n.createdAt && (
                        <div className="cp-notif-time">
                          {new Date(n.createdAt).toLocaleString("ru-RU")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </CourierLayout>
  );
}