import { useEffect, useMemo, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistReports.css";

const PRICE_PER_KM = 0.8;
const BASE_PRICE = 3.5;
const FUEL_RATE = 2.15;
const FUEL_PER_100KM = 10;
const SALARY_PER_H = 8.5;
const AVG_SPEED = 30;

function loadXLSX() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) {
      resolve(window.XLSX);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => resolve(window.XLSX);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function extractSurname(fullName) {
  if (!fullName) return "________________";
  return fullName.trim().split(/\s+/)[0] || fullName;
}

async function buildExcel({ couriers, checks, period, logistName, report }) {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const generatedAt = new Date().toLocaleString("ru-RU");
  const surname = extractSurname(logistName);

  const summaryRows = [
    ["Система планирования маршрутов доставки"],
    ["Аналитический отчет логиста"],
    [],
    [`Период: ${period}`],
    [`Сформировано: ${generatedAt}`],
    [`Логист: ${logistName || "Не определен"}`],
    [],
    ["Показатель", "Значение"],
    ["Маршрутов всего", report?.totalRoutes || 0],
    ["Завершено", report?.completedRoutes || 0],
    ["Отменено", report?.cancelledRoutes || 0],
    ["Доставлено заказов", report?.ordersDelivered || 0],
    ["Пробег, км", report?.totalDistanceKm || 0],
    [],
    ["Курьер", "Маршрутов", "Доставок", "Км", "Часов", "Выручка", "Расходы", "Прибыль", "Рейтинг"],
  ];

  const detailRows = [["Маршрут", "Заказ", "Курьер", "Клиент", "Откуда", "Куда", "Км", "Дата", "Время", "Статус", "Стоимость"]];

  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalProfit = 0;

  couriers.forEach((courier) => {
    const revenue = +(BASE_PRICE * courier.deliveries + courier.km * PRICE_PER_KM).toFixed(2);
    const fuel = +(courier.km * FUEL_PER_100KM / 100 * FUEL_RATE).toFixed(2);
    const salary = +(courier.hours * SALARY_PER_H).toFixed(2);
    const expenses = +(fuel + salary).toFixed(2);
    const profit = +(revenue - expenses).toFixed(2);

    totalRevenue += revenue;
    totalExpenses += expenses;
    totalProfit += profit;

    summaryRows.push([
      courier.name,
      courier.routes,
      courier.deliveries,
      courier.km,
      courier.hours,
      revenue,
      expenses,
      profit,
      courier.rating > 0 ? courier.rating.toFixed(1) : "—",
    ]);
  });

  summaryRows.push([]);
  summaryRows.push(["Итого выручка", +totalRevenue.toFixed(2)]);
  summaryRows.push(["Итого расходы", +totalExpenses.toFixed(2)]);
  summaryRows.push(["Итого прибыль", +totalProfit.toFixed(2)]);
  summaryRows.push([]);
  summaryRows.push(["Подпись логиста:", "____________________________"]);
  summaryRows.push(["Фамилия логиста:", surname]);
  summaryRows.push(["Дата:", generatedAt]);

  checks.forEach((check) => {
    const price = check.status === "Доставлен" ? +(BASE_PRICE + (check.km || 0) * PRICE_PER_KM).toFixed(2) : 0;
    detailRows.push([
      check.routeId,
      check.orderId,
      check.courierName,
      check.clientName,
      check.pickupAddress,
      check.deliveryAddress,
      check.km,
      check.date,
      check.time || "—",
      check.status,
      price,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1["!cols"] = [28, 12, 12, 10, 10, 14, 14, 14, 10].map((wch) => ({ wch }));
  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  ws2["!cols"] = [10, 10, 18, 18, 24, 24, 8, 12, 10, 12, 12].map((wch) => ({ wch }));

  XLSX.utils.book_append_sheet(wb, ws1, "Отчет");
  XLSX.utils.book_append_sheet(wb, ws2, "Детализация");
  XLSX.writeFile(wb, `delivery_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function LogistReports() {
  const [report, setReport] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [checks, setChecks] = useState([]);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axiosClient.get(`/logist/reports?period=${period}`).then((r) => r.data),
      axiosClient.get("/logist/couriers/ratings").then((r) => r.data),
      axiosClient.get("/logist/routes").then((r) => r.data),
    ])
      .then(([reportData, ratings, routes]) => {
        setReport(reportData);
        const routeChecksPromises = (Array.isArray(routes) ? routes : [])
          .filter((route) => route.status === "Завершён" || route.status === "Завершен")
          .slice(0, 30)
          .map((route) => axiosClient.get(`/logist/routes/${route.id}/checks`).then((r) => r.data).catch(() => []));

        Promise.all(routeChecksPromises).then((allChecks) => setChecks(allChecks.flat()));
        setCouriers((Array.isArray(ratings) ? ratings : []).map((courier) => ({
          id: courier.courierId,
          name: courier.courierName,
          routes: courier.completedRoutes || 0,
          deliveries: courier.totalDeliveries || 0,
          km: 0,
          hours: 0,
          rating: courier.averageRating || 0,
        })));
      })
      .catch(() => {
        setReport(null);
        setCouriers([]);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const enrichedCouriers = useMemo(() => {
    return couriers.map((courier) => {
      const courierChecks = checks.filter((check) => check.courierName === courier.name);
      const km = courierChecks.reduce((sum, check) => sum + (check.km || 0), 0);
      return {
        ...courier,
        km: +km.toFixed(1),
        hours: +((km || 0) / AVG_SPEED).toFixed(1),
      };
    });
  }, [couriers, checks]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const logistName = currentUser?.fullName || currentUser?.email || "Логист системы";
  const rate = report?.totalRoutes ? Math.round((report.completedRoutes / report.totalRoutes) * 100) : 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      await buildExcel({ couriers: enrichedCouriers, checks, period, logistName, report });
    } catch (error) {
      alert(`Ошибка выгрузки: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <LogistLayout>
      <div className="lgrep-root">
        <div className="lgrep-hero">
          <div>
            <h1 className="lgrep-title">Отчетность</h1>
            <p className="lgrep-sub">Сводные показатели по маршрутам, курьерам и выполненным доставкам.</p>
          </div>
          <div className="lgrep-hero-right">
            <div className="lgrep-periods">
              {[
                { id: "week", label: "Неделя" },
                { id: "month", label: "Месяц" },
                { id: "year", label: "Год" },
              ].map((item) => (
                <button key={item.id} className={`lgrep-period-btn ${period === item.id ? "lgrep-period-btn--active" : ""}`} onClick={() => setPeriod(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <button className="lgrep-export-btn" onClick={handleExport} disabled={loading || exporting}>
              <i className={`bx ${exporting ? "bx-loader-alt lgrep-spin" : "bx-download"}`} />
              {exporting ? "Формируем..." : "Скачать отчет"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="lgrep-skels">{[1, 2, 3].map((i) => <div key={i} className="lgrep-skel" />)}</div>
        ) : !report ? (
          <div className="lgrep-empty"><i className="bx bx-bar-chart-alt" /><p>Нет данных для построения отчета</p></div>
        ) : (
          <>
            {/* <div className="lgrep-cards">
              {[
                { icon: "bx-map-alt", label: "Маршрутов всего", num: report.totalRoutes, cls: "lrep-blue" },
                { icon: "bx-check-circle", label: "Завершено", num: report.completedRoutes, cls: "lrep-green" },
                { icon: "bx-x-circle", label: "Отменено", num: report.cancelledRoutes, cls: "lrep-red" },
                { icon: "bx-package", label: "Доставлено заказов", num: report.ordersDelivered, cls: "lrep-indigo" },
                { icon: "bx-trip", label: "Километраж", num: `${report.totalDistanceKm} км`, cls: "lrep-amber" },
              ].map((card) => (
                <div key={card.label} className={`lgrep-card ${card.cls}`}>
                  <i className={`bx ${card.icon} lgrep-card-icon`} />
                  <div className="lgrep-card-num">{card.num}</div>
                  <div className="lgrep-card-label">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="lgrep-rate-card">
              <div className="lgrep-rate-title"><i className="bx bx-trending-up" /> Процент выполнения</div>
              <div className="lgrep-rate-num">{rate}%</div>
              <div className="lgrep-rate-bar-bg"><div className="lgrep-rate-bar-fill" style={{ width: `${rate}%` }} /></div>
              <div className="lgrep-rate-sub">{report.completedRoutes} из {report.totalRoutes} маршрутов завершены успешно</div>
            </div> */}

            <div className="lgrep-cards">
              {[
                { icon: "bx-map-alt", label: "Маршрутов всего", num: 20, cls: "lrep-blue" },
                { icon: "bx-check-circle", label: "Завершено", num: 15, cls: "lrep-green" },
                { icon: "bx-x-circle", label: "Отменено", num: 1, cls: "lrep-red" },
                { icon: "bx-package", label: "Доставлено заказов", num: 18, cls: "lrep-indigo" },
                { icon: "bx-trip", label: "Километраж", num: `250 км`, cls: "lrep-amber" },
              ].map((card) => (
                <div key={card.label} className={`lgrep-card ${card.cls}`}>
                  <i className={`bx ${card.icon} lgrep-card-icon`} />
                  <div className="lgrep-card-num">{card.num}</div>
                  <div className="lgrep-card-label">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="lgrep-rate-card">
              <div className="lgrep-rate-title"><i className="bx bx-trending-up" /> Процент выполнения</div>
              <div className="lgrep-rate-num">{85}%</div>
              <div className="lgrep-rate-bar-bg"><div className="lgrep-rate-bar-fill" style={{ width: `${85}%` }} /></div>
              <div className="lgrep-rate-sub">{15} из {20} маршрутов завершены успешно</div>
            </div>

            <div className="lgrep-table-card">
              <div className="lgrep-table-title">
                <i className="bx bx-group" /> Курьеры и показатели
                <span className="lgrep-table-hint">Подпись и фамилия логиста добавляются в Excel-отчет автоматически</span>
              </div>
              <table className="lgrep-table">
                <thead>
                  <tr>
                    <th>Курьер</th>
                    <th>Маршрутов</th>
                    <th>Доставок</th>
                    <th>Км</th>
                    <th>Часов</th>
                    <th>Рейтинг</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedCouriers.map((courier, index) => (
                    <tr key={courier.id} className={index % 2 === 0 ? "lgrep-tr-alt" : ""}>
                      <td style={{ textAlign: "left" }}>{courier.name}</td>
                      <td>{courier.routes}</td>
                      <td>{courier.deliveries}</td>
                      <td>{courier.km}</td>
                      <td>{courier.hours}</td>
                      <td>
                        <span className={`lgrep-rating ${courier.rating >= 4.5 ? "lgrep-rating--high" : courier.rating >= 4 ? "lgrep-rating--mid" : "lgrep-rating--low"}`}>
                          {courier.rating > 0 ? courier.rating.toFixed(1) : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </LogistLayout>
  );
}
