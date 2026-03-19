import { Link, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../../styles/client/ClientSidebar.css";

const NAV_ITEMS = [
  { to: "/client",               icon: "bx bx-home-alt",        label: "Главная"       },
  { to: "/client/create",        icon: "bx bx-package",         label: "Новый заказ"  },
  { to: "/client/orders",        icon: "bx bx-list-ul",         label: "Мои заказы"   },
  { to: "/client/track",         icon: "bx bx-map-alt",         label: "Отслеживание" },
  { to: "/client/notifications", icon: "bx bx-bell",            label: "Уведомления"  },
];

export default function ClientSidebar({ open, setOpen }) {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axiosClient.post("/auth/logout");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      console.error("Ошибка выхода:", err);
    }
  };

  return (
    <>
      <div className={`csidebar ${open ? "open" : "collapsed"}`}>

        {/* LOGO */}
        <h2 className="csidebar-logo">
          {open
            ? <><i className="bx bxs-truck" /> Delivry</>
            : <i className="bx bxs-truck" />
          }
        </h2>

        {/* NAV */}
        <nav className="csidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/client" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`csidebar-link ${active ? "csidebar-link--active" : ""}`}
              >
                <i className={item.icon} />
                {open && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="csidebar-bottom">
          <button
            type="button"
            className="csidebar-btn"
            onClick={() => (window.location.href = "/profile")}
          >
            <i className="bx bx-cog" />
            {open && <span>Профиль</span>}
          </button>
          <button
            type="button"
            className="csidebar-btn csidebar-btn--logout"
            onClick={handleLogout}
          >
            <i className="bx bx-log-out" />
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      {/* TOGGLE — прижат к правому краю сайдбара */}
      <button
        className="csidebar-toggle"
        style={{ left: open ? "248px" : "58px" }}
        onClick={() => setOpen(!open)}
        aria-label="toggle sidebar"
      >
        <i className={`bx ${open ? "bx-chevron-left" : "bx-chevron-right"}`} />
      </button>
    </>
  );
}