import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistSidebar.css";

const NAV_ITEMS = [
  { to: "/logist", icon: "bx bx-home-alt", label: "Главная" },
  { to: "/logist/orders", icon: "bx bx-package", label: "Заказы" },
  { to: "/logist/routes", icon: "bx bx-map-alt", label: "Маршруты" },
  { to: "/logist/calendar", icon: "bx bx-calendar", label: "Календарь" },
  { to: "/logist/vehicles", icon: "bx bxs-truck", label: "Автопарк" },
  { to: "/logist/couriers", icon: "bx bx-group", label: "Курьеры" },
  { to: "/logist/reports", icon: "bx bx-bar-chart-alt-2", label: "Отчеты" },
  { to: "/logist/notifications", icon: "bx bx-bell", label: "Уведомления", badge: true },
];

export default function LogistSidebar({ open, setOpen }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      axiosClient.get("/logist/notifications")
        .then((r) => {
          const list = Array.isArray(r.data) ? r.data : r.data?.content || [];
          setUnread(list.filter((n) => n.statusNotification === 0).length);
        })
        .catch(() => {});

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try { await axiosClient.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <div className={`lgsidebar ${open ? "open" : "collapsed"}`}>
        <div className="lgsidebar-logo">
          <i className="bx bxs-map-alt lgsidebar-logo-icon" />
          {open && <span className="lgsidebar-logo-text">Delivry</span>}
        </div>

        {open && <div className="lgsidebar-role"><i className="bx bx-briefcase" /> Логист</div>}

        <nav className="lgsidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to || (item.to !== "/logist" && location.pathname.startsWith(item.to));
            const showBadge = item.badge && unread > 0;
            return (
              <Link key={item.to} to={item.to} className={`lgsidebar-link ${active ? "lgsidebar-link--active" : ""}`}>
                <span className="lgsidebar-icon-wrap">
                  <i className={item.icon} />
                  {showBadge && !open && <span className="lgsidebar-badge-dot" />}
                </span>
                {open && <span className="lgsidebar-link-label">{item.label}</span>}
                {open && showBadge && <span className="lgsidebar-badge">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="lgsidebar-bottom">
          <button type="button" className="lgsidebar-btn" onClick={() => window.location.href = "/logist/profile"}>
            <i className="bx bx-cog" />
            {open && <span>Профиль</span>}
          </button>
          <button type="button" className="lgsidebar-btn lgsidebar-btn--logout" onClick={handleLogout}>
            <i className="bx bx-log-out" />
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      <button className="lgsidebar-toggle" style={{ left: open ? "248px" : "62px" }} onClick={() => setOpen(!open)}>
        <i className={`bx ${open ? "bx-chevron-left" : "bx-chevron-right"}`} />
      </button>
    </>
  );
}
