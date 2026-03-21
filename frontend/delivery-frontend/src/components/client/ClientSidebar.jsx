import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/ClientSidebar.css";

// ← Убран дубликат "Калькулятор" — уникальные ключи
const NAV_ITEMS = [
  { to: "/client",               icon: "bx bx-home-alt",    label: "Главная"       },
  { to: "/client/create",        icon: "bx bx-package",     label: "Новый заказ"  },
  { to: "/client/calculator",    icon: "bx bx-calculator",  label: "Калькулятор"  },
  { to: "/client/orders",        icon: "bx bx-list-ul",     label: "Мои заказы"   },
  { to: "/client/track",         icon: "bx bx-map-alt",     label: "Отслеживание" },
  { to: "/client/notifications", icon: "bx bx-bell",        label: "Уведомления", badge: true },
  { to: "/profile",              icon: "bx bx-user-circle", label: "Профиль"      },
];

export default function ClientSidebar({ open, setOpen }) {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () =>
      axiosClient.get("/client/notifications")
        .then(r => {
          const list = Array.isArray(r.data) ? r.data : r.data?.content || [];
          setUnread(list.filter(n => n.statusNotification === 0).length);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try { await axiosClient.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <div className={`csidebar ${open ? "open" : "collapsed"}`}>

        <div className="csidebar-logo">
          <i className="bx bxs-truck csidebar-logo-icon" />
          {open && <span className="csidebar-logo-text">Delivry</span>}
        </div>

        {open && <div className="csidebar-role">Клиент</div>}

        <nav className="csidebar-nav">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.to ||
              (item.to !== "/client" && item.to !== "/profile" &&
               location.pathname.startsWith(item.to));
            const showBadge = item.badge && unread > 0;
            return (
              <Link key={item.to} to={item.to}
                className={`csidebar-link ${active ? "csidebar-link--active" : ""}`}>
                <span className="csidebar-link-icon-wrap">
                  <i className={item.icon} />
                  {showBadge && !open && <span className="csidebar-badge-dot" />}
                </span>
                {open && <span className="csidebar-link-label">{item.label}</span>}
                {open && showBadge && (
                  <span className="csidebar-badge">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="csidebar-bottom">
          <button type="button" className="csidebar-btn csidebar-btn--logout" onClick={handleLogout}>
            <i className="bx bx-log-out" />
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      <button className="csidebar-toggle" style={{ left: open ? "248px" : "62px" }}
        onClick={() => setOpen(o => !o)}>
        <i className={`bx ${open ? "bx-chevron-left" : "bx-chevron-right"}`} />
      </button>
    </>
  );
}