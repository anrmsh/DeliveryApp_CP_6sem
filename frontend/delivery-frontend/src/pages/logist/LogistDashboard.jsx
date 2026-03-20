import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistDashboard.css";

export default function LogistDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/logist/dashboard");
        setStats(res.data);
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  const CARDS = stats ? [
    { icon: "bx-package",          label: "Всего заказов",       num: stats.totalOrders,   cls: "lgd-blue",   path: "/logist/orders"   },
    { icon: "bx-time",             label: "Ожидают назначения",  num: stats.pendingOrders, cls: "lgd-amber",  path: "/logist/orders"   },
    { icon: "bx-map-alt",          label: "Активных маршрутов",  num: stats.activeRoutes,  cls: "lgd-green",  path: "/logist/routes"   },
    { icon: "bxs-truck",           label: "Свободных авто",      num: stats.freeVehicles,  cls: "lgd-indigo", path: "/logist/vehicles" },
    { icon: "bx-group",            label: "Курьеров",            num: stats.totalCouriers, cls: "lgd-teal",   path: "/logist/couriers" },
  ] : [];

  return (
    <LogistLayout>
      <div className="lgd-root">

        {/* HERO */}
        <div className="lgd-hero">
          <div>
            <h1 className="lgd-title">Панель логиста</h1>
            <p className="lgd-sub">
              {new Date().toLocaleDateString("ru-RU", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
          <button className="lgd-create-btn" onClick={() => navigate("/logist/routes/new")}>
            <i className="bx bx-plus" /> Новый маршрут
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="lgd-cards">
          {loading
            ? [1,2,3,4,5].map(i => <div key={i} className="lgd-skel" />)
            : CARDS.map(c => (
              <div key={c.label} className={`lgd-card ${c.cls}`} onClick={() => navigate(c.path)}>
                <i className={`bx ${c.icon} lgd-card-icon`} />
                <div className="lgd-card-num">{c.num}</div>
                <div className="lgd-card-label">{c.label}</div>
              </div>
            ))
          }
        </div>

        {/* QUICK ACTIONS */}
        <div className="lgd-section-title">
          <i className="bx bx-bolt-circle" /> Быстрые действия
        </div>
        <div className="lgd-actions">
          {[
            { icon: "bx-map-alt",         label: "Создать маршрут",   path: "/logist/routes/new"  },
            { icon: "bx-package",         label: "Все заказы",        path: "/logist/orders"      },
            { icon: "bxs-truck",          label: "Автопарк",          path: "/logist/vehicles"    },
            { icon: "bx-star",            label: "Рейтинг курьеров",  path: "/logist/couriers"    },
            { icon: "bx-bar-chart-alt-2", label: "Отчёты",            path: "/logist/reports"     },
          ].map(a => (
            <button key={a.label} className="lgd-action-btn" onClick={() => navigate(a.path)}>
              <i className={`bx ${a.icon}`} />
              <span>{a.label}</span>
            </button>
          ))}
        </div>

      </div>
    </LogistLayout>
  );
}