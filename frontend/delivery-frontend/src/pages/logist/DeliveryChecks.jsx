import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDateTime } from "../../utils/dateUtils";
import { generateDeliveryDoc } from "../../utils/deliveryCheckDoc";
import "../../styles/logist/DeliveryChecks.css";

const PRICE_PER_KM = 0.80;
const BASE_PRICE   = 3.50;

export default function DeliveryChecks() {
  const { routeId } = useParams();
  const navigate    = useNavigate();
  const [checks,   setChecks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [downloading, setDL]   = useState(null);

  useEffect(() => {
    axiosClient.get(`/logist/routes/${routeId}/checks`)
      .then(r => setChecks(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [routeId]);

  const handleDownload = async (check) => {
    setDL(check.pointId);
    try {
      const km    = parseFloat(check.distanceKm || check.km || 0);
      const price = +(BASE_PRICE + km * PRICE_PER_KM).toFixed(2);
      await generateDeliveryDoc({
        routeId:          check.routeId,
        orderId:          check.orderId,
        courierName:      check.courierName || "—",
        courierPhone:     check.courierPhone,
        vehicleModel:     check.vehicleModel,
        vehiclePlate:     check.vehiclePlate,
        clientName:       check.clientName || "—",
        clientPhone:      check.clientPhone,
        clientCompany:    check.clientCompany,
        pickupAddress:    check.pickupAddress,
        deliveryAddress:  check.deliveryAddress,
        routePlannedStart:check.routePlannedStart,
        actualArrival:    check.actualArrival,
        plannedArrival:   check.plannedArrival,
        distanceKm:       km,
        comment:          check.comment,
        price,
      });
    } catch (e) { console.error(e); }
    finally { setDL(null); }
  };

  return (
    <LogistLayout>
      <div className="dc-root">
        <button className="dc-back" onClick={() => navigate(`/logist/routes/${routeId}`)}>
          <i className="bx bx-arrow-back"/> К маршруту #{routeId}
        </button>

        <div className="dc-hero">
          <h1 className="dc-title">Чеки маршрута #{routeId}</h1>
          <p className="dc-sub">Акты доставки по каждой точке</p>
        </div>

        {loading ? (
          <div className="dc-skels">{[1,2,3].map(i => <div key={i} className="dc-skel"/>)}</div>
        ) : checks.length === 0 ? (
          <div className="dc-empty">
            <i className="bx bx-receipt"/>
            <p>Нет данных о доставках</p>
            <span>Чеки появятся когда курьер отметит точки как «Посещена»</span>
          </div>
        ) : (
          <div className="dc-list">
            {checks.map(ch => (
              <div key={ch.pointId} className="dc-card">
                <div className="dc-card-left">
                  <div className="dc-card-id">
                    <i className="bx bx-receipt"/> Заказ #{ch.orderId}
                    <span className="dc-seq">Точка {ch.sequenceNumber}</span>
                  </div>
                  <div className="dc-route">
                    <span className="dc-dot dc-dot--a">A</span>
                    <span>{ch.pickupAddress}</span>
                  </div>
                  <div className="dc-route">
                    <span className="dc-dot dc-dot--b">Б</span>
                    <span>{ch.deliveryAddress}</span>
                  </div>
                  <div className="dc-meta">
                    {ch.clientName && (
                      <span>
                        <i className="bx bx-user"/>
                        {ch.clientName}{ch.clientCompany ? ` · ${ch.clientCompany}` : ""}
                      </span>
                    )}
                    {ch.actualArrival && (
                      <span><i className="bx bx-time"/> {fmtDateTime(ch.actualArrival)}</span>
                    )}
                    {ch.courierName && (
                      <span><i className="bx bxs-truck"/> {ch.courierName}</span>
                    )}
                  </div>
                </div>
                <div className="dc-card-right">
                  <div className={`dc-status dc-status--${ch.status === "Посещена" ? "done" : "skip"}`}>
                    {ch.status === "Посещена" ? "Доставлен" : "Пропущен"}
                  </div>
                  <button
                    className="dc-download-btn"
                    onClick={() => handleDownload(ch)}
                    disabled={downloading === ch.pointId || ch.status !== "Посещена"}>
                    <i className={`bx ${downloading === ch.pointId ? "bx-loader-alt dc-spin" : "bx-download"}`}/>
                    {downloading === ch.pointId ? "Формируем..." : "Акт .docx"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}