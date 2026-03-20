import { Link, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistSidebar.css";

const NAV_ITEMS = [
  { to: "/logist",           icon: "bx bx-home-alt",         label: "Главная"       },
  { to: "/logist/orders",    icon: "bx bx-package",          label: "Заказы"        },
  { to: "/logist/routes",    icon: "bx bx-map-alt",          label: "Маршруты"      },
  { to: "/logist/vehicles",  icon: "bx bxs-truck",           label: "Автопарк"      },
  { to: "/logist/couriers",  icon: "bx bx-group",            label: "Курьеры"       },
  { to: "/logist/reports",   icon: "bx bx-bar-chart-alt-2",  label: "Отчёты"        },
];

export default function LogistSidebar({ open, setOpen }) {
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
      <div className={`lgsidebar ${open ? "open" : "collapsed"}`}>

        {/* LOGO */}
        <h2 className="lgsidebar-logo">
          {open
            ? <><i className="bx bxs-map-alt" /> Delivry</>
            : <i className="bx bxs-map-alt" />
          }
        </h2>

        {/* ROLE BADGE */}
        {open && (
          <div className="lgsidebar-role">
            <i className="bx bx-briefcase" /> Логист
          </div>
        )}

        {/* NAV */}
        <nav className="lgsidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to !== "/logist" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`lgsidebar-link ${active ? "lgsidebar-link--active" : ""}`}
              >
                <i className={item.icon} />
                {open && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* BOTTOM */}
        <div className="lgsidebar-bottom">
          <button
            type="button"
            className="lgsidebar-btn"
            onClick={() => (window.location.href = "/logist/profile")}
          >
            <i className="bx bx-cog" />
            {open && <span>Профиль</span>}
          </button>
          <button
            type="button"
            className="lgsidebar-btn lgsidebar-btn--logout"
            onClick={handleLogout}
          >
            <i className="bx bx-log-out" />
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      <button
        className="lgsidebar-toggle"
        style={{ left: open ? "248px" : "58px" }}
        onClick={() => setOpen(!open)}
        aria-label="toggle sidebar"
      >
        <i className={`bx ${open ? "bx-chevron-left" : "bx-chevron-right"}`} />
      </button>
    </>
  );
}