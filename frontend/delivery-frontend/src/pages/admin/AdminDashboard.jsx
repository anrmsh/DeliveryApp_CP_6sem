import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getUsers } from "../../api/adminApi";
import "../../styles/admin/AdminDashboard.css";

/* ─── CONSTANTS ─── */
const ROLE_META = {
  ADMIN:   { color: "#b45309", bg: "rgba(180,83,9,0.12)",   fill: "linear-gradient(90deg,#b45309,#fbbf24)" },
  LOGIST:  { color: "#7c3aed", bg: "rgba(124,58,237,0.12)", fill: "linear-gradient(90deg,#7c3aed,#a78bfa)" },
  COURIER: { color: "#16a34a", bg: "rgba(22,163,74,0.12)",  fill: "linear-gradient(90deg,#16a34a,#22c55e)" },
  CLIENT:  { color: "#2563eb", bg: "rgba(37,99,235,0.12)",  fill: "linear-gradient(90deg,#2563eb,#60a5fa)" },
};

/* ─── HELPERS ─── */
function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
}

function formatDate() {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* Имитация часовой активности на основе числа пользователей */
function buildActivityBars(total) {
  const hours   = ["09","10","11","12","13","14","15","16","17","18","19","20"];
  const weights = [3,5,8,10,12,11,9,8,7,5,3,2];
  const sum     = weights.reduce((a, b) => a + b, 0);
  return hours.map((h, i) => ({
    hour:  h,
    count: Math.max(1, Math.round((weights[i] / sum) * total * 6)),
  }));
}

/* ─── COMPONENT ─── */
export default function AdminDashboard() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getUsers({});
        setUsers(data.content || []);
      } catch { /* не критично для дашборда */ }
      finally { setLoading(false); }
    })();
  }, []);

  /* ── derived stats ── */
  const total   = users.length;
  const active  = users.filter(u => u.status === "Активен").length;
  const blocked = users.filter(u => u.status === "Заблокирован").length;
  const couriers = users.filter(u => u.role?.toUpperCase() === "COURIER").length;
  const logists  = users.filter(u => u.role?.toUpperCase() === "LOGIST").length;

  const roleRows = [
    { role: "COURIER", count: couriers },
    { role: "LOGIST",  count: logists  },
    { role: "CLIENT",  count: users.filter(u => u.role?.toUpperCase() === "CLIENT").length },
    { role: "ADMIN",   count: users.filter(u => u.role?.toUpperCase() === "ADMIN").length  },
  ].filter(r => r.count > 0);

  const maxRole  = Math.max(...roleRows.map(r => r.count), 1);
  const recent   = [...users].slice(-7).reverse();
  const actBars  = buildActivityBars(total);
  const maxAct   = Math.max(...actBars.map(b => b.count), 1);

  /* ─── RENDER ─── */
  return (
    <DashboardLayout>
      <div className="dash-root">

        {/* ── HERO ── */}
        <div className="dash-hero">
          <div className="dash-hero-left">
            <h1 className="dash-greeting">
              {formatDate()}
              
            </h1>
            
          </div>
          <div className="dash-hero-badge">
            <span className="dash-hero-badge-dot" />
           
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="dash-stat-grid">
          {[
            { cls:"c-teal",   icon:"👥", num: total,   label:"Всего пользователей" },
            { cls:"c-green",  icon:"✅", num: active,  label:"Активных аккаунтов"  },
            { cls:"c-red",    icon:"🔒", num: blocked, label:"Заблокировано"        },
            { cls:"c-indigo", icon:"🚚", num: couriers,label:"Курьеров"             },
            { cls:"c-amber",  icon:"📋", num: logists, label:"Логистов"             },
          ].map(card => (
            <div key={card.label} className={`dash-stat-card ${card.cls}`}>
              <span className="dash-stat-icon">{card.icon}</span>
              <div className="dash-stat-num">{loading ? "—" : card.num}</div>
              <div className="dash-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="dash-main-grid">

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Распределение ролей */}
            <div className="dash-panel">
              <p className="dash-panel-title">Распределение ролей</p>
              {loading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {[1,2,3].map(i => <div key={i} className="dash-skel" style={{ width: `${60+i*10}%` }} />)}
                </div>
              ) : (
                <div className="dash-role-list">
                  {roleRows.map(r => {
                    const m   = ROLE_META[r.role] || ROLE_META.CLIENT;
                    const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                    return (
                      <div className="dash-role-row" key={r.role}>
                        <div className="dash-role-head">
                          <span className="dash-role-name" style={{ color: m.color }}>{r.role}</span>
                          <span className="dash-role-count">{r.count} чел. · {pct}%</span>
                        </div>
                        <div className="dash-role-track">
                          <div
                            className="dash-role-fill"
                            style={{
                              width: `${(r.count / maxRole) * 100}%`,
                              background: m.fill,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Активность сессий */}
            <div className="dash-panel">
              <p className="dash-panel-title">Активность сессий — сегодня</p>
              <div style={{ fontSize:"0.75rem", color:"#9ca3af", marginBottom:10 }}>
                Расчётное число активных сессий по часам (на основе базы пользователей)
              </div>
              <div className="dash-chart-wrap">
                {actBars.map(b => (
                  <div className="dash-bar-col" key={b.hour}>
                    <div
                      className="dash-bar"
                      style={{ height: `${Math.max((b.count / maxAct) * 100, 5)}%` }}
                      title={`${b.hour}:00 — ~${b.count} сессий`}
                    />
                    <span className="dash-bar-lbl">{b.hour}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Последние пользователи */}
            <div className="dash-panel">
              <p className="dash-panel-title">Последние добавленные</p>
              {loading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[1,2,3,4].map(i => <div key={i} className="dash-skel" />)}
                </div>
              ) : recent.length === 0 ? (
                <div style={{ color:"#9ca3af", fontSize:"0.84rem", textAlign:"center", padding:"20px 0" }}>
                  Нет данных
                </div>
              ) : (
                <div className="dash-user-list">
                  {recent.map(u => {
                    const m = ROLE_META[u.role?.toUpperCase()] || ROLE_META.CLIENT;
                    return (
                      <div className="dash-user-row" key={u.id}>
                        <div className="dash-avatar" style={{ background: m.bg, color: m.color }}>
                          {getInitials(u.fullName)}
                        </div>
                        <div className="dash-user-info">
                          <div className="dash-uname">{u.fullName}</div>
                          <div className="dash-uemail">{u.email}</div>
                        </div>
                        <div
                          className="dash-udot"
                          style={{ background: u.status === "Заблокирован" ? "#ef4444" : "#22c55e" }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Быстрые действия */}
            <div className="dash-panel">
              <p className="dash-panel-title">Быстрые действия</p>
              <div className="dash-actions-grid">
                {[
                  { icon:"👤", label:"Все пользователи", path:"/admin/users"                           },
                  { icon:"🚚", label:"Курьеры",           path:"/admin/users?role=COURIER"              },
                  { icon:"🔒", label:"Заблокированные",   path:"/admin/users?status=Заблокирован"       },
                  { icon:"📋", label:"Логисты",           path:"/admin/users?role=LOGIST"               },
                ].map(a => (
                  <button
                    key={a.label}
                    className="dash-action-btn"
                    onClick={() => navigate(a.path)}
                  >
                    <span className="dash-action-icon">{a.icon}</span>
                    <span className="dash-action-label">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── BOTTOM BANNER ── */}
        <div className="dash-banner">
          <span className="dash-banner-icon">💡</span>
          <div className="dash-banner-text">
            <strong>Доступно управление пользователями.</strong>{" "}
            Добавляйте сотрудников, редактируйте данные, блокируйте и удаляйте аккаунты —
            всё в разделе «Пользователи».
          </div>
          <button className="dash-goto-btn" onClick={() => navigate("/admin/users")}>
            Перейти →
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}