import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useState } from "react";
import "../../styles/Sidebar.css";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  const toggleSidebar = () => setOpen(!open);

  const handleLogout = async () => {
    try {
      await axiosClient.post("/auth/logout"); // бэкенд logout
      localStorage.removeItem("token");        // очистка токена
      window.location.href = "/login";         // надёжный редирект
    } catch (err) {
      console.error("Ошибка выхода:", err);
    }
  };

  const handleProfile = () => {
    window.location.href = "/profile";
  };

  return (
    <>
      <div className={`sidebar ${open ? "open" : "collapsed"}`}>
        <h2 className="logo">
          {open ? "Delivery AI" : <i className="bx bxs-rocket"></i>}
        </h2>

        <nav>
          <Link to="/admin">
            <i className="bx bx-bar-chart-alt-2"></i>
            {open && <span>Главная</span>}
          </Link>
          <Link to="/admin/users">
            <i className="bx bx-user"></i>
            {open && <span>Пользователи</span>}
          </Link>
          
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-btn" onClick={handleProfile}>
            <i className="bx bx-cog"></i>
            {open && <span>Профиль</span>}
          </button>
          <button type="button" className="sidebar-btn" onClick={handleLogout}>
            <i className="bx bx-log-out"></i>
            {open && <span>Выход</span>}
          </button>
        </div>
      </div>

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {open ? <i className="bx bx-x"></i> : <i className="bx bx-menu"></i>}
      </button>
    </>
  );
}