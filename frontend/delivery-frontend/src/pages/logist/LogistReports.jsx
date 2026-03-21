import { useEffect, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistReports.css";

/* ─── Constants ─────────────────────────────────────────────── */
const PRICE_PER_KM   = 0.80;
const BASE_PRICE     = 3.50;
const FUEL_RATE      = 2.15;
const FUEL_PER_100KM = 10.0;
const SALARY_PER_H   = 8.50;
const AVG_SPEED      = 30.0;

/* ─── Load SheetJS from CDN ──────────────────────────────────── */
function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload  = () => resolve(window.XLSX);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ─── Excel builder ─────────────────────────────────────────── */
async function buildExcel(couriers, checks, period) {
  const XLSX = await loadXLSX();
  const wb   = XLSX.utils.book_new();

  // ── Sheet 1: Сводный отчёт ───────────────────────────────
  const today = new Date().toLocaleDateString("ru-RU");
  const s1rows = [
    [`ВелоГруз Экспресс — Отчёт по курьерам`],
    [`Период: ${period} | Сформирован: ${today}`],
    [],
    ["ФИО курьера","Маршрутов","Доставлено","Пропущено",
     "Км (итого)","Время (ч)","Выручка (BYN)","Расходы (BYN)","Прибыль (BYN)","Рейтинг ★"],
  ];

  let totR=0, totE=0, totP=0, totKm=0, totDel=0, totRoutes=0;
  const calcRow = (c) => {
    const rev  = +(BASE_PRICE * c.deliveries + c.km * PRICE_PER_KM).toFixed(2);
    const fuel = +(c.km * FUEL_PER_100KM / 100 * FUEL_RATE).toFixed(2);
    const sal  = +(c.hours * SALARY_PER_H).toFixed(2);
    const exp  = +(fuel + sal).toFixed(2);
    const prof = +(rev - exp).toFixed(2);
    return { rev, exp, prof };
  };

  couriers.forEach(c => {
    const { rev, exp, prof } = calcRow(c);
    totR += rev; totE += exp; totP += prof; totKm += c.km;
    totDel += c.deliveries; totRoutes += c.routes;
    s1rows.push([c.name, c.routes, c.deliveries, c.skipped || 0,
                 c.km, c.hours, rev, exp, prof, c.rating]);
  });

  s1rows.push(["ИТОГО", totRoutes, totDel, "", +totKm.toFixed(1), "",
               +totR.toFixed(2), +totE.toFixed(2), +totP.toFixed(2), ""]);
  s1rows.push([]);
  s1rows.push([`Нормативы: тариф ${PRICE_PER_KM} BYN/км + ${BASE_PRICE} BYN флаг | топливо ${FUEL_RATE} BYN/л, ${FUEL_PER_100KM} л/100км | зарплата ${SALARY_PER_H} BYN/ч`]);

  const ws1 = XLSX.utils.aoa_to_sheet(s1rows);
  ws1["!cols"] = [28,12,12,12,12,12,14,14,14,10].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, "Сводный отчёт");

  // ── Sheet 2: Детализация ─────────────────────────────────
  const s2rows = [
    [`ВелоГруз Экспресс — Детализация по курьерам`],
    [],
    ["ФИО курьера","Маршрутов","Доставлено","Пропущено","Км","Часов",
     "Выручка (BYN)","Топливо (BYN)","Зарплата (BYN)","Расходы (BYN)","Прибыль (BYN)"],
  ];

  couriers.forEach(c => {
    const rev  = +(BASE_PRICE * c.deliveries + c.km * PRICE_PER_KM).toFixed(2);
    const fuel = +(c.km * FUEL_PER_100KM / 100 * FUEL_RATE).toFixed(2);
    const sal  = +(c.hours * SALARY_PER_H).toFixed(2);
    s2rows.push([c.name, c.routes, c.deliveries, c.skipped||0,
                 c.km, c.hours, rev, fuel, sal, +(fuel+sal).toFixed(2), +(rev-fuel-sal).toFixed(2)]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(s2rows);
  ws2["!cols"] = [28,12,12,12,10,10,14,14,14,14,14].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws2, "Детализация");

  // ── Sheet 3: Чеки доставки ───────────────────────────────
  const s3rows = [
    [`ВелоГруз Экспресс — Чеки доставки`],
    [],
    ["№ маршрута","№ заказа","Курьер","Клиент","Откуда","Куда",
     "Км","Дата","Время","Статус","Стоимость (BYN)"],
  ];

  let totalChecksSum = 0;
  checks.forEach(ch => {
    const price = ch.status === "Доставлен"
      ? +(BASE_PRICE + ch.km * PRICE_PER_KM).toFixed(2) : 0;
    totalChecksSum += price;
    s3rows.push([ch.routeId, ch.orderId, ch.courierName, ch.clientName,
                 ch.pickupAddress, ch.deliveryAddress, ch.km,
                 ch.date, ch.time || "—", ch.status, price]);
  });

  s3rows.push(["ИТОГО","","","","","",
               +checks.reduce((s,c)=>s+c.km,0).toFixed(1),
               "","","",+totalChecksSum.toFixed(2)]);

  const ws3 = XLSX.utils.aoa_to_sheet(s3rows);
  ws3["!cols"] = [10,10,18,20,24,24,7,12,10,12,14].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws3, "Чеки доставки");

  XLSX.writeFile(wb, `velogruz_report_${today.replace(/\./g,"-")}.xlsx`);
}

/* ─── Component ─────────────────────────────────────────────── */
export default function LogistReports() {
  const [report,     setReport]    = useState(null);
  const [couriers,   setCouriers]  = useState([]);
  const [checks,     setChecks]    = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [exporting,  setExporting] = useState(false);
  const [period,     setPeriod]    = useState("month");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get(`/logist/reports?period=${period}`).then(r => r.data),
      axiosClient.get("/logist/couriers/ratings").then(r => r.data),
    ])
      .then(([rep, crs]) => {
        setReport(rep);
        // Map courier ratings to stats shape
        setCouriers((Array.isArray(crs) ? crs : []).map(c => ({
          id:          c.courierId,
          name:        c.courierName,
          routes:      c.completedRoutes  || 0,
          deliveries:  c.totalDeliveries  || 0,
          skipped:     0,
          km:          0,   // заполнится если бэк вернёт
          hours:       0,
          rating:      c.averageRating || 0,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  /* Load checks for all recent routes */
  useEffect(() => {
    axiosClient.get("/logist/routes")
      .then(r => {
        const routes = Array.isArray(r.data) ? r.data : [];
        const done   = routes.filter(rt => rt.status === "Завершён").slice(0, 20);
        return Promise.all(
          done.map(rt => axiosClient.get(`/logist/routes/${rt.id}/checks`)
            .then(c => c.data).catch(() => []))
        );
      })
      .then(allChecks => setChecks(allChecks.flat()))
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Enrich couriers with km/hours from checks
      const enriched = couriers.map(c => {
        const myChecks = checks.filter(ch => ch.courierName?.includes(c.name?.split(" ")[0]));
        const km = myChecks.reduce((s, ch) => s + (ch.km || 0), 0);
        return { ...c, km: +km.toFixed(1), hours: +(km / AVG_SPEED).toFixed(1) };
      });
      await buildExcel(enriched, checks, period);
    } catch (e) {
      alert("Ошибка при генерации: " + e.message);
    } finally { setExporting(false); }
  };

  const rate = report && report.totalRoutes > 0
    ? Math.round((report.completedRoutes / report.totalRoutes) * 100) : 0;

  const PERIODS = [
    { id: "week",  label: "Неделя" },
    { id: "month", label: "Месяц"  },
    { id: "year",  label: "Год"    },
  ];

  return (
    <LogistLayout>
      <div className="lgrep-root">

        {/* Hero */}
        <div className="lgrep-hero">
          <div>
            <h1 className="lgrep-title">Отчётность</h1>
            <p className="lgrep-sub">Анализ маршрутов и финансовые показатели</p>
          </div>
          <div className="lgrep-hero-right">
            <div className="lgrep-periods">
              {PERIODS.map(p => (
                <button key={p.id}
                  className={`lgrep-period-btn ${period === p.id ? "lgrep-period-btn--active" : ""}`}
                  onClick={() => setPeriod(p.id)}>{p.label}</button>
              ))}
            </div>
            {/* Excel export button */}
            <button className="lgrep-export-btn" onClick={handleExport}
              disabled={exporting || loading}>
              <i className={`bx ${exporting ? "bx-loader-alt lgrep-spin" : "bx-download"}`}/>
              {exporting ? "Генерируем..." : "Скачать .xlsx"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="lgrep-skels">
            {[1,2,3].map(i => <div key={i} className="lgrep-skel"/>)}
          </div>
        ) : !report ? (
          <div className="lgrep-empty">
            <i className="bx bx-bar-chart-alt"/><p>Нет данных</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="lgrep-cards">
              {[
                { icon:"bx-map-alt",     label:"Маршрутов всего",    num:report.totalRoutes,      cls:"lrep-blue"   },
                { icon:"bx-check-circle",label:"Завершено",           num:report.completedRoutes,  cls:"lrep-green"  },
                { icon:"bx-x-circle",    label:"Отменено",            num:report.cancelledRoutes,  cls:"lrep-red"    },
                { icon:"bx-package",     label:"Доставлено заказов",  num:report.ordersDelivered,  cls:"lrep-indigo" },
                { icon:"bx-trip",        label:"Километраж",          num:`${report.totalDistanceKm} км`, cls:"lrep-amber" },
              ].map(c => (
                <div key={c.label} className={`lgrep-card ${c.cls}`}>
                  <i className={`bx ${c.icon} lgrep-card-icon`}/>
                  <div className="lgrep-card-num">{c.num}</div>
                  <div className="lgrep-card-label">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Success rate */}
            <div className="lgrep-rate-card">
              <div className="lgrep-rate-title">
                <i className="bx bx-trending-up"/> Процент выполнения
              </div>
              <div className="lgrep-rate-num">{rate}%</div>
              <div className="lgrep-rate-bar-bg">
                <div className="lgrep-rate-bar-fill" style={{ width:`${rate}%` }}/>
              </div>
              <div className="lgrep-rate-sub">
                {report.completedRoutes} из {report.totalRoutes} маршрутов завершено успешно
              </div>
            </div>

            {/* Couriers mini-table */}
            {couriers.length > 0 && (
              <div className="lgrep-table-card">
                <div className="lgrep-table-title">
                  <i className="bx bx-group"/> Рейтинг курьеров за период
                  <span className="lgrep-table-hint">Полная таблица — в .xlsx</span>
                </div>
                <table className="lgrep-table">
                  <thead>
                    <tr>
                      {["Курьер","Маршрутов","Доставок","Рейтинг"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.slice(0,5).map((c,i) => (
                      <tr key={c.id} className={i%2===0?"lgrep-tr-alt":""}>
                        <td style={{textAlign:"left"}}>{c.name}</td>
                        <td>{c.routes}</td>
                        <td>{c.deliveries}</td>
                        <td>
                          <span className={`lgrep-rating ${c.rating >= 4.5 ? "lgrep-rating--high" : c.rating >= 4.0 ? "lgrep-rating--mid" : "lgrep-rating--low"}`}>
                            ★ {c.rating > 0 ? c.rating.toFixed(1) : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </LogistLayout>
  );
}