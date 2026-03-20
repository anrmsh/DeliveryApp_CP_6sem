// ═══════════════════════════════════════════════════════════════════
// LogistReports.jsx  —  src/pages/logist/LogistReports.jsx
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistReports.css";

export default function LogistReports() {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("month");

  useEffect(() => {
    setLoading(true);
    axiosClient.get(`/logist/reports?period=${period}`)
      .then(res => setReport(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const rate = report && report.totalRoutes > 0
    ? Math.round((report.completedRoutes / report.totalRoutes) * 100)
    : 0;

  return (
    <LogistLayout>
      <div className="lgrep-root">
        <div className="lgrep-hero">
          <div>
            <h1 className="lgrep-title">Отчётность</h1>
            <p className="lgrep-sub">Анализ выполненных маршрутов</p>
          </div>
          <div className="lgrep-periods">
            {[
              { id: "week",  label: "Неделя" },
              { id: "month", label: "Месяц"  },
              { id: "year",  label: "Год"    },
            ].map(p => (
              <button
                key={p.id}
                className={`lgrep-period-btn ${period === p.id ? "lgrep-period-btn--active" : ""}`}
                onClick={() => setPeriod(p.id)}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="lgrep-skels">
            {[1,2,3].map(i => <div key={i} className="lgrep-skel" />)}
          </div>
        ) : !report ? (
          <div className="lgrep-empty">
            <i className="bx bx-bar-chart-alt" />
            <p>Нет данных</p>
          </div>
        ) : (
          <>
            <div className="lgrep-cards">
              {[
                { icon: "bx-map-alt",          label: "Маршрутов всего",     num: report.totalRoutes,     cls: "lrep-blue"  },
                { icon: "bx-check-circle",      label: "Завершено",           num: report.completedRoutes, cls: "lrep-green" },
                { icon: "bx-x-circle",          label: "Отменено",            num: report.cancelledRoutes, cls: "lrep-red"   },
                { icon: "bx-package",           label: "Доставлено заказов",  num: report.ordersDelivered, cls: "lrep-indigo"},
                { icon: "bx-trip",              label: "Километраж",          num: `${report.totalDistanceKm} км`, cls: "lrep-amber" },
              ].map(c => (
                <div key={c.label} className={`lgrep-card ${c.cls}`}>
                  <i className={`bx ${c.icon} lgrep-card-icon`} />
                  <div className="lgrep-card-num">{c.num}</div>
                  <div className="lgrep-card-label">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Success rate */}
            <div className="lgrep-rate-card">
              <div className="lgrep-rate-title">
                <i className="bx bx-trending-up" /> Процент выполнения
              </div>
              <div className="lgrep-rate-num">{rate}%</div>
              <div className="lgrep-rate-bar-bg">
                <div className="lgrep-rate-bar-fill" style={{ width: `${rate}%` }} />
              </div>
              <div className="lgrep-rate-sub">
                {report.completedRoutes} из {report.totalRoutes} маршрутов завершено успешно
              </div>
            </div>
          </>
        )}
      </div>
    </LogistLayout>
  );
}