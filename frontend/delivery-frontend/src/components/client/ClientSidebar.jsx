import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useState } from "react";
import "../../styles/Sidebar.css";

export default function ClientSidebar() {
  const [open, setOpen] = useState(true);

  const toggleSidebar = () => setOpen(!open);

  const logout = async () => {
    await axiosClient.post("/auth/logout");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <div className={`sidebar ${open ? "open" : "collapsed"}`}>
        <h2 className="logo">{open ? "Delivery AI" : "🚚"}</h2>

        <nav>
          <Link to="/client">🏠 Dashboard</Link>
          <Link to="/client/create">📦 Create Delivery</Link>
          <Link to="/client/orders">📑 Orders</Link>
          <Link to="/client/track">📍 Track</Link>
          <Link to="/client/notifications">🔔 Notifications</Link>
        </nav>

        <div className="sidebar-bottom">
          <button>⚙ Profile</button>
          <button onClick={logout}>🚪 Logout</button>
        </div>
      </div>

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
    </>
  );
}