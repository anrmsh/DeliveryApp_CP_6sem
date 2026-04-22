import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/HomePage.css"

const STEPS = [
  { label: "Принят",    state: "done"    },
  { label: "На складе", state: "done"    },
  { label: "В пути",    state: "active"  },
  { label: "Доставлен", state: "pending" },
];

const FEATURES = [
  {
    mod: "teal",
    bg: "#e6fffa",
    stroke: "#0d9488",
    title: "Реальное время",
    desc: "Местоположение курьеров и статус заказов обновляются мгновенно без перезагрузки страницы",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    mod: "green",
    bg: "#f0fdf4",
    stroke: "#16a34a",
    title: "Управление заказами",
    desc: "Создание, редактирование и назначение заказов курьерам в пару кликов",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    mod: "blue",
    bg: "#eff6ff",
    stroke: "#2563eb",
    title: "Роли и доступы",
    desc: "Отдельные кабинеты для клиентов, курьеров, логистов и администраторов",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    mod: "amber",
    bg: "#fffbeb",
    stroke: "#d97706",
    title: "Аналитика",
    desc: "Статистика по доставкам, маршрутам и курьерам для управленческих решений",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
];

const ROLES = [
  {
    to: "/login",
    tagBg: "#d1fae5", tagColor: "#065f46",
    label: "Клиент",
    title: "Оформляйте заказы",
    desc: "Создавайте заявки, отслеживайте доставку и управляйте историей заказов",
  },
  {
    to: "/login",
    tagBg: "#dbeafe", tagColor: "#1e40af",
    label: "Курьер",
    title: "Выполняйте доставки",
    desc: "Получайте назначения, обновляйте статус и управляйте своими маршрутами",
  },
  {
    to: "/login",
    tagBg: "#fef3c7", tagColor: "#92400e",
    label: "Логист",
    title: "Оптимизируйте маршруты",
    desc: "Распределяйте заказы между курьерами и контролируйте эффективность",
  },
  {
    to: "/login",
    tagBg: "#ede9fe", tagColor: "#4c1d95",
    label: "Администратор",
    title: "Управляйте системой",
    desc: "Полный контроль над пользователями, настройками и отчётами платформы",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [trackId, setTrackId] = useState("");
  const [trackedId, setTrackedId] = useState(null);

  const handleTrack = () => {
    if (trackId.trim()) setTrackedId(trackId.trim());
  };

  return (
    <div className="hp-root">

      {/* NAV */}
      <nav className="hp-nav">
        <Link to="/" className="hp-logo">
          <div className="hp-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
          <span className="hp-logo-text">DeliveryApp</span>
        </Link>
        <div className="hp-nav-links">
          <a href="#features" className="hp-nav-link">Возможности</a>
          <a href="#track" className="hp-nav-link">Трекинг</a>
          <a href="#roles" className="hp-nav-link">Роли</a>
          <Link to="/login" className="hp-nav-cta">Войти</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hp-hero">
        
        <h1 className="hp-h1">
          Доставка, которая<br />
          <span>всегда приходит</span> вовремя
        </h1>
        <p className="hp-hero-desc">
          Управляйте заказами, отслеживайте курьеров в реальном времени
          и координируйте логистику в едином кабинете.
        </p>
        <div className="hp-hero-btns">
          <Link to="/register" className="hp-btn-primary">Начать работу</Link>
          <a href="#features" className="hp-btn-secondary">Узнать подробнее</a>
        </div>
      </section>

      {/* STATS */}
      <div className="hp-stats">
        <div className="hp-stat">
          <div className="hp-stat-num">98%</div>
          <div className="hp-stat-label">доставок вовремя</div>
        </div>
        <div className="hp-stat">
          <div className="hp-stat-num">4</div>
          <div className="hp-stat-label">роли в системе</div>
        </div>
        <div className="hp-stat">
          <div className="hp-stat-num">24/7</div>
          <div className="hp-stat-label">онлайн-трекинг</div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="hp-section hp-section--white">
        <div className="hp-section-head">
          <div className="hp-section-tag">Возможности</div>
          <div className="hp-section-title">Всё для эффективной доставки</div>
          <div className="hp-section-sub">
            Инструменты для каждого участника процесса — от клиента до администратора
          </div>
        </div>
        <div className="hp-features">
          {FEATURES.map((f) => (
            <div key={f.title} className={`hp-feat-card hp-feat-card--${f.mod}`}>
              <div className="hp-feat-icon" style={{ background: f.bg, color: f.stroke }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRACKING */}
      <section id="track" className="hp-track">
        <div className="hp-track-inner">
          <div className="hp-section-tag">Трекинг</div>
          <div className="hp-section-title" style={{ fontSize: "1.4rem" }}>Отследить заказ</div>
          <div className="hp-track-row">
            <input
              className="hp-track-input"
              placeholder="Введите номер заказа, например ORD-20481"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
            />
            <button className="hp-track-btn" onClick={handleTrack}>Отследить</button>
          </div>

          {trackedId && (
            <div className="hp-track-result">
              <p className="hp-track-meta">
                Заказ <strong>{trackedId}</strong> · Курьер: Алексей К. · ETA: ~20 мин
              </p>
              <div className="hp-timeline">
                {STEPS.map((s, i) => (
                  <div key={s.label} className={`hp-tl-step hp-tl-step--${s.state}`}>
                    <div className="hp-tl-circle">
                      {s.state === "done" ? "✓" : s.state === "active" ? "▶" : i + 1}
                    </div>
                    <div className="hp-tl-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="hp-section">
        <div className="hp-section-head">
          <div className="hp-section-tag">Личный кабинет</div>
          <div className="hp-section-title">Выберите свою роль</div>
          <div className="hp-section-sub">
            Каждый пользователь получает персональный интерфейс под свои задачи
          </div>
        </div>
        <div className="hp-roles">
          {ROLES.map((r) => (
            <div key={r.label} className="hp-role-card">
              <span
                className="hp-role-tag"
                style={{ background: r.tagBg, color: r.tagColor }}
              >
                {r.label}
              </span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <Link to={r.to} className="hp-role-link">
                Войти как {r.label.toLowerCase()} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hp-footer">
        <p className="hp-footer-copy">© 2025 DeliveryApp — система управления доставками</p>
        <div className="hp-footer-links">
          <Link to="/privacy" className="hp-footer-link">Конфиденциальность</Link>
          <Link to="/support" className="hp-footer-link">Поддержка</Link>
          <Link to="/login" className="hp-footer-link">Войти</Link>
        </div>
      </footer>

    </div>
  );
}