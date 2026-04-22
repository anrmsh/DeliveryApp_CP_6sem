import { useNavigate } from "react-router-dom";
import "../styles/client/LandingPage.css"
const FEATURES = [
  {
    icon: "🗺️",
    title: "Умная маршрутизация",
    text: "Алгоритм строит оптимальный маршрут в реальном времени с учётом пробок и загруженности дорог.",
  },
  {
    icon: "🌦️",
    title: "Учёт погоды",
    text: "Система анализирует погодные условия и корректирует расчётное время доставки автоматически.",
  },
  {
    icon: "📦",
    title: "Любой груз",
    text: "Легковые и грузовые автомобили. Укажите вес и габариты — мы подберём подходящий транспорт.",
  },
  {
    icon: "📍",
    title: "Отслеживание онлайн",
    text: "Следите за курьером в реальном времени. Никакой неизвестности — вы всегда знаете, где ваш заказ.",
  },
  {
    icon: "🔔",
    title: "Push-уведомления",
    text: "Мгновенные уведомления о смене статуса, задержках и прибытии курьера.",
  },
  {
    icon: "⭐",
    title: "Рейтинг курьеров",
    text: "После каждой доставки вы можете оценить курьера. Мы следим за качеством сервиса.",
  },
];

const STEPS = [
  { num: "01", title: "Создайте заказ",        text: "Укажите адреса, габариты груза и удобное время." },
  { num: "02", title: "Получите расчёт",        text: "Система моментально рассчитает стоимость и время с учётом пробок." },
  { num: "03", title: "Курьер забирает груз",   text: "Логист назначит подходящий транспорт и курьера." },
  { num: "04", title: "Доставка выполнена",     text: "Вы получите уведомление и сможете оценить сервис." },
];

const STATS = [
  { num: "50 000+", label: "Доставок выполнено" },
  { num: "98%",     label: "Довольных клиентов" },
  { num: "4.9 ★",   label: "Средняя оценка"     },
  { num: "24/7",    label: "Поддержка"           },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-logo">🚚 <span>Delivry</span></div>
          <nav className="lp-nav-links">
            <a href="#features">Возможности</a>
            <a href="#how">Как работает</a>
            <a href="#stats">О нас</a>
          </nav>
           <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Войти</button>
            
          </div> 



          
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-blob lp-hero-blob--1" />
          <div className="lp-hero-blob lp-hero-blob--2" />
          <div className="lp-hero-grid" />
        </div>
        <div className="lp-hero-inner">
          <span className="lp-hero-badge">🟢 Работаем 24/7 по всему городу</span>
          <h1 className="lp-hero-title">
            Доставка, которая<br />
            <em>всегда приходит вовремя</em>
          </h1>
          <p className="lp-hero-sub">
           Управляйте заказами, отслеживайте курьеров в реальном времени
          и координируйте логистику в едином кабинете.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/login")}>
              Оформить доставку →
            </button>
            <div className="lp-btn-ghost lp-btn-lg">  
          <a href="#features"  className="hp-btn-secondary" >Узнать подробнее</a>
          </div>

          </div>
          <div className="lp-hero-trucks">
            <VehicleSVG type="car" />
            <div className="lp-route-line">
              <span className="lp-route-dot" />
              <span className="lp-route-dashes" />
              <span className="lp-route-dot lp-route-dot--end" />
            </div>
            <VehicleSVG type="truck" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats" id="stats">
        <div className="lp-stats-inner">
          {STATS.map((s) => (
            <div className="lp-stat" key={s.label}>
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-inner">
          <span className="lp-section-tag">Возможности</span>
          <h2 className="lp-section-title">Всё для удобной доставки</h2>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card" key={f.title}>
                <span className="lp-feature-icon">{f.icon}</span>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-text">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-how" id="how">
        <div className="lp-section-inner">
          <span className="lp-section-tag">Процесс</span>
          <h2 className="lp-section-title">Как это работает</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={s.num}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-content">
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
                {i < STEPS.length - 1 && <div className="lp-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VEHICLE SECTION ── */}
      <section className="lp-vehicles">
        <div className="lp-section-inner">
          <span className="lp-section-tag">Транспорт</span>
          <h2 className="lp-section-title">Выберите подходящий автомобиль</h2>
          <div className="lp-vehicle-cards">
            <div className="lp-vehicle-card">
              <VehicleSVG type="car" size={120} />
              <h3>Легковой автомобиль</h3>
              <ul>
                <li>До 200 кг</li>
                <li>До 1 м³</li>
                <li>Быстрая доставка</li>
                <li>Документы, посылки, еда</li>
              </ul>
            </div>
            <div className="lp-vehicle-card lp-vehicle-card--featured">
              <div className="lp-vehicle-badge">Популярный</div>
              <VehicleSVG type="van" size={120} />
              <h3>Грузовой фургон</h3>
              <ul>
                <li>До 1 500 кг</li>
                <li>До 10 м³</li>
                <li>Мебель, техника</li>
                <li>Переезды</li>
              </ul>
            </div>
            <div className="lp-vehicle-card">
              <VehicleSVG type="truck" size={120} />
              <h3>Грузовик</h3>
              <ul>
                <li>До 5 000 кг</li>
                <li>До 30 м³</li>
                <li>Крупногабаритный груз</li>
                <li>Паллеты, оборудование</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Готовы к первой доставке?</h2>
          <p>Зарегистрируйтесь и оформите заказ за 2 минуты</p>
          <button className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/register")}>
            Создать аккаунт →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">🚚 <strong>Delivry</strong></div>
          <p className="lp-footer-copy">© 2025 Delivry. Все права защищены.</p>
        </div>
      </footer>

    </div>
  );
}

/* ── SVG vehicles ── */
export function VehicleSVG({ type = "car", size = 80 }) {
  if (type === "truck") return (
    <svg width={size} height={size * 0.55} viewBox="0 0 120 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="0" y="12" width="85" height="38" rx="4" fill="#0d9488" />
      {/* cab */}
      <rect x="85" y="18" width="30" height="32" rx="4" fill="#0f766e" />
      {/* window */}
      <rect x="89" y="21" width="22" height="14" rx="2" fill="#a7f3d0" opacity="0.8" />
      {/* wheels */}
      <circle cx="18" cy="53" r="10" fill="#134e4a" />
      <circle cx="18" cy="53" r="5" fill="#6ee7b7" />
      <circle cx="55" cy="53" r="10" fill="#134e4a" />
      <circle cx="55" cy="53" r="5" fill="#6ee7b7" />
      <circle cx="100" cy="53" r="10" fill="#134e4a" />
      <circle cx="100" cy="53" r="5" fill="#6ee7b7" />
      {/* headlight */}
      <rect x="112" y="28" width="6" height="6" rx="2" fill="#fbbf24" />
    </svg>
  );

  if (type === "van") return (
    <svg width={size} height={size * 0.6} viewBox="0 0 110 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="14" width="75" height="36" rx="4" fill="#7c3aed" />
      <rect x="75" y="20" width="28" height="30" rx="4" fill="#6d28d9" />
      <rect x="78" y="23" width="20" height="13" rx="2" fill="#ddd6fe" opacity="0.85" />
      <circle cx="16" cy="54" r="10" fill="#1e1b4b" />
      <circle cx="16" cy="54" r="5" fill="#a78bfa" />
      <circle cx="90" cy="54" r="10" fill="#1e1b4b" />
      <circle cx="90" cy="54" r="5" fill="#a78bfa" />
      <rect x="100" y="30" width="6" height="6" rx="2" fill="#fbbf24" />
    </svg>
  );

  // car (default)
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 100 55" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="5" y="20" width="88" height="26" rx="6" fill="#16a34a" />
      {/* roof */}
      <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#15803d" />
      {/* windshield front */}
      <path d="M63 8 Q78 8 83 20 L65 20Z" fill="#bbf7d0" opacity="0.85" />
      {/* windshield rear */}
      <path d="M22 8 Q28 8 35 20 L20 20Z" fill="#bbf7d0" opacity="0.85" />
      {/* windows mid */}
      <rect x="36" y="9" width="26" height="11" rx="2" fill="#bbf7d0" opacity="0.75" />
      {/* wheels */}
      <circle cx="24" cy="47" r="9" fill="#134e4a" />
      <circle cx="24" cy="47" r="4" fill="#6ee7b7" />
      <circle cx="76" cy="47" r="9" fill="#134e4a" />
      <circle cx="76" cy="47" r="4" fill="#6ee7b7" />
      {/* headlight */}
      <rect x="90" y="26" width="7" height="5" rx="2" fill="#fef08a" />
      {/* taillight */}
      <rect x="3" y="26" width="5" height="5" rx="2" fill="#fca5a5" />
    </svg>
  );
}