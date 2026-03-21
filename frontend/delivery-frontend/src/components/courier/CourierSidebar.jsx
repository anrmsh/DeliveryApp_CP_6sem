import { Link, useLocation } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../../styles/courier/CourierSidebar.css";

const NAV_ITEMS = [
  { to: "/courier",         icon: "bx bx-home-alt",        label: "Главная"        },
  { to: "/courier/route",   icon: "bx bx-map-alt",         label: "Мой маршрут"   },
  { to: "/courier/history", icon: "bx bx-history",         label: "История"        },
  { to: "/courier/profile", icon: "bx bx-user",            label: "Профиль"        },
];

export default function CourierSidebar({ open, setOpen }) {
  const location = useLocation();

  const handleLogout = async () => {
    try { await axiosClient.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <div className={`csb ${open ? "open" : "collapsed"}`}>
        <h2 className="csb-logo">
          {open ? <><i className="bx bxs-truck" /> Delivry</> : <i className="bx bxs-truck" />}
        </h2>
        {open && <div className="csb-role"><i className="bx bx-car" /> Курьер</div>}

        <nav className="csb-nav">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.to ||
              (item.to !== "/courier" && location.pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to}
                className={`csb-link ${active ? "csb-link--active" : ""}`}>
                <i className={item.icon} />
                {open && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="csb-bottom">
          <button type="button" className="csb-btn csb-btn--logout" onClick={handleLogout}>
            <i className="bx bx-log-out" />
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      <button className="csb-toggle" style={{ left: open ? "248px" : "58px" }}
        onClick={() => setOpen(!open)}>
        <i className={`bx ${open ? "bx-chevron-left" : "bx-chevron-right"}`} />
      </button>
    </>
  );
}