// ═══════════════════════════════════════════════════════════════════
// LogistVehicles.jsx  —  src/pages/logist/LogistVehicles.jsx
// ═══════════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import "../../styles/logist/LogistVehicles.css";

const V_STATUS_META = {
  "Доступен":         { color: "#16a34a", bg: "rgba(22,163,74,0.1)"  },
  "В рейсе":          { color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  "На обслуживании":  { color: "#dc2626", bg: "rgba(220,38,38,0.1)"  },
};

export default function LogistVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sort,     setSort]     = useState("");

  const load = async () => {
    try {
      const params = [];
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`);
      if (sort)         params.push(`sort=${sort}`);
      const res = await axiosClient.get(`/logist/vehicles?${params.join("&")}`);
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter, sort]);

  return (
    <LogistLayout>
      <div className="lgv-root">
        <div className="lgv-hero">
          <div>
            <h1 className="lgv-title">Автопарк</h1>
            <p className="lgv-sub">Управление автомобилями, фильтрация и сортировка</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="lgv-toolbar">
          <div className="lgv-filters">
            {["", "Доступен", "В рейсе", "На обслуживании"].map(s => (
              <button
                key={s}
                className={`lgv-filter ${statusFilter === s ? "lgv-filter--active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >{s || "Все"}</button>
            ))}
          </div>
          <select
            className="lgv-sort"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="">Сортировка</option>
            <option value="capacity">По грузоподъёмности</option>
            <option value="volume">По объёму</option>
          </select>
        </div>

        {loading ? (
          <div className="lgv-grid">
            {[1,2,3,4].map(i => <div key={i} className="lgv-skel" />)}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="lgv-empty">
            <i className="bx bxs-truck" />
            <p>Автомобилей не найдено</p>
          </div>
        ) : (
          <div className="lgv-grid">
            {vehicles.map(v => {
              const m = V_STATUS_META[v.status] || { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
              return (
                <div key={v.id} className="lgv-card">
                  <div className="lgv-card-top">
                    <VehicleIcon capacityKg={v.capacityKg} />
                    <span className="lgv-badge" style={{ color: m.color, background: m.bg }}>
                      {v.status}
                    </span>
                  </div>
                  <div className="lgv-card-model">{v.model}</div>
                  <div className="lgv-card-plate">
                    <i className="bx bx-id-card" /> {v.plateNumber}
                  </div>
                  <div className="lgv-card-specs">
                    <div className="lgv-spec">
                      <i className="bx bx-package" />
                      <span>{v.capacityKg} кг</span>
                    </div>
                    <div className="lgv-spec">
                      <i className="bx bx-cube" />
                      <span>{v.volumeM3} м³</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}
