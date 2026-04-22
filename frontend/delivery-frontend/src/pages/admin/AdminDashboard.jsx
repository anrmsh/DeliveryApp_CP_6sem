import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getUsers } from "../../api/adminApi";
import "../../styles/admin/AdminDashboard.css";

const ROLE_META = {
  ADMIN: { color: "#b45309", bg: "rgba(180,83,9,0.12)", fill: "linear-gradient(90deg,#b45309,#fbbf24)" },
  LOGIST: { color: "#7c3aed", bg: "rgba(124,58,237,0.12)", fill: "linear-gradient(90deg,#7c3aed,#a78bfa)" },
  COURIER: { color: "#16a34a", bg: "rgba(22,163,74,0.12)", fill: "linear-gradient(90deg,#16a34a,#22c55e)" },
  CLIENT: { color: "#2563eb", bg: "rgba(37,99,235,0.12)", fill: "linear-gradient(90deg,#2563eb,#60a5fa)" },
};

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "?";
}

function formatDate() {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildActivityBars(total) {
  const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
  const weights = [3, 5, 8, 10, 12, 11, 9, 8, 7, 5, 3, 2];
  const sum = weights.reduce((a, b) => a + b, 0);
  return hours.map((hour, index) => ({
    hour,
    count: Math.max(1, Math.round((weights[index] / sum) * total * 6)),
  }));
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getUsers({});
        setUsers(data.content || []);
      } catch {}
      finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = users.length;
  const active = users.filter((u) => u.status === "Активен").length;
  const blocked = users.filter((u) => u.status === "Заблокирован").length;
  const couriers = users.filter((u) => u.role?.toUpperCase() === "COURIER").length;
  const logists = users.filter((u) => u.role?.toUpperCase() === "LOGIST").length;

  const roleRows = [
    { role: "COURIER", count: couriers },
    { role: "LOGIST", count: logists },
    { role: "CLIENT", count: users.filter((u) => u.role?.toUpperCase() === "CLIENT").length },
    { role: "ADMIN", count: users.filter((u) => u.role?.toUpperCase() === "ADMIN").length },
  ].filter((item) => item.count > 0);

  const maxRole = Math.max(...roleRows.map((item) => item.count), 1);
  const recent = [...users].slice(-7).reverse();
  const activityBars = buildActivityBars(total);
  const maxActivity = Math.max(...activityBars.map((item) => item.count), 1);

  const statCards = [
    { cls: "c-teal", icon: "bx bx-group", num: total, label: "Всего пользователей" },
    { cls: "c-green", icon: "bx bx-check-shield", num: active, label: "Активных аккаунтов" },
    { cls: "c-red", icon: "bx bx-lock-alt", num: blocked, label: "Заблокировано" },
    { cls: "c-indigo", icon: "bx bxs-truck", num: couriers, label: "Курьеров" },
    { cls: "c-amber", icon: "bx bx-briefcase-alt-2", num: logists, label: "Логистов" },
  ];

  const actions = [
    { icon: "bx bx-group", label: "Все пользователи", path: "/admin/users" },
    { icon: "bx bxs-truck", label: "Курьеры", path: "/admin/users?role=COURIER" },
    { icon: "bx bx-lock-alt", label: "Заблокированные", path: "/admin/users?status=Заблокирован" },
    { icon: "bx bx-briefcase-alt-2", label: "Логисты", path: "/admin/users?role=LOGIST" },
  ];

  return (
    <DashboardLayout>
      <div className="dash-root">
        <div className="dash-hero">
          <div className="dash-hero-left">
            <h1 className="dash-greeting">{formatDate()}</h1>
          </div>
          <div className="dash-hero-badge">
            <span className="dash-hero-badge-dot" /> Панель администратора
          </div>
        </div>

        <div className="dash-stat-grid">
          {statCards.map((card) => (
            <div key={card.label} className={`dash-stat-card ${card.cls}`}>
              <i className={`dash-stat-icon ${card.icon}`} />
              <div className="dash-stat-num">{loading ? "—" : card.num}</div>
              <div className="dash-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="dash-main-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="dash-panel">
              <p className="dash-panel-title">Распределение ролей</p>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[1, 2, 3].map((i) => <div key={i} className="dash-skel" style={{ width: `${60 + i * 10}%` }} />)}
                </div>
              ) : (
                <div className="dash-role-list">
                  {roleRows.map((row) => {
                    const meta = ROLE_META[row.role] || ROLE_META.CLIENT;
                    const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    return (
                      <div className="dash-role-row" key={row.role}>
                        <div className="dash-role-head">
                          <span className="dash-role-name" style={{ color: meta.color }}>{row.role}</span>
                          <span className="dash-role-count">{row.count} чел. · {pct}%</span>
                        </div>
                        <div className="dash-role-track">
                          <div className="dash-role-fill" style={{ width: `${(row.count / maxRole) * 100}%`, background: meta.fill }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dash-panel">
              <p className="dash-panel-title">Активность сессий — сегодня</p>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 10 }}>
                Расчетное число активных сессий по часам.
              </div>
              <div className="dash-chart-wrap">
                {activityBars.map((item) => (
                  <div className="dash-bar-col" key={item.hour}>
                    <div className="dash-bar" style={{ height: `${Math.max((item.count / maxActivity) * 100, 5)}%` }} title={`${item.hour}:00 — ~${item.count} сессий`} />
                    <span className="dash-bar-lbl">{item.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="dash-panel">
              <p className="dash-panel-title">Последние добавленные</p>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3, 4].map((i) => <div key={i} className="dash-skel" />)}
                </div>
              ) : recent.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: "0.84rem", textAlign: "center", padding: "20px 0" }}>Нет данных</div>
              ) : (
                <div className="dash-user-list">
                  {recent.map((user) => {
                    const meta = ROLE_META[user.role?.toUpperCase()] || ROLE_META.CLIENT;
                    return (
                      <div className="dash-user-row" key={user.id}>
                        <div className="dash-avatar" style={{ background: meta.bg, color: meta.color }}>{getInitials(user.fullName)}</div>
                        <div className="dash-user-info">
                          <div className="dash-uname">{user.fullName}</div>
                          <div className="dash-uemail">{user.email}</div>
                        </div>
                        <div className="dash-udot" style={{ background: user.status === "Заблокирован" ? "#ef4444" : "#22c55e" }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dash-panel">
              <p className="dash-panel-title">Быстрые действия</p>
              <div className="dash-actions-grid">
                {actions.map((action) => (
                  <button key={action.label} className="dash-action-btn" onClick={() => navigate(action.path)}>
                    <i className={`dash-action-icon ${action.icon}`} />
                    <span className="dash-action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-banner">
          <span className="dash-banner-icon"><i className="bx bx-bulb" /></span>
          <div className="dash-banner-text">
            <strong>Доступно управление пользователями.</strong> Добавляйте сотрудников, редактируйте данные, блокируйте и удаляйте аккаунты в разделе «Пользователи».
          </div>
          <button className="dash-goto-btn" onClick={() => navigate("/admin/users")}>Перейти →</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
