import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LogistLayout from "../../components/layout/LogistLayout";
import axiosClient from "../../api/axiosClient";
import { fmtDate, fmtDateTime } from "../../dateUtils";
import "../../styles/logist/DeliveryChecks.css";

const COMPANY = {
  name:    "ВелоГруз Экспресс",
  tagline: "Доставка с умом, маршрут с сердцем",
  phone:   "+375 (29) 800-04-25",
  email:   "info@velogruz.by",
  address: "г. Минск, пр-т Независимости, 32",
};

/* ── Single check card ── */
function CheckCard({ check, idx }) {
  return (
    <div className="dc-check" id={`check-${check.pointId}`}>
      {/* Header */}
      <div className="dc-check-header">
        <div className="dc-check-company">
          <div className="dc-company-logo">
            <i className="bx bxs-truck" />
          </div>
          <div>
            <div className="dc-company-name">{COMPANY.name}</div>
            <div className="dc-company-tag">{COMPANY.tagline}</div>
          </div>
        </div>
        <div className="dc-check-meta">
          <div className="dc-check-num">Чек доставки #{check.orderId || check.pointId}</div>
          <div className="dc-check-date">{fmtDateTime(check.actualArrival || check.plannedArrival)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="dc-check-body">
        <div className="dc-section">
          <div className="dc-section-title"><i className="bx bx-map-pin" /> Маршрут</div>
          <div className="dc-row"><span>Откуда</span><strong>{check.pickupAddress || "—"}</strong></div>
          <div className="dc-row"><span>Куда</span><strong>{check.deliveryAddress || check.address}</strong></div>
          <div className="dc-row"><span>Точка №</span><strong>{check.sequenceNumber}</strong></div>
          {check.plannedArrival && (
            <div className="dc-row"><span>Плановое прибытие</span><strong>{fmtDateTime(check.plannedArrival)}</strong></div>
          )}
          {check.actualArrival && (
            <div className="dc-row dc-row--green"><span>Фактическое прибытие</span><strong>{fmtDateTime(check.actualArrival)}</strong></div>
          )}
        </div>

        <div className="dc-divider" />

        <div className="dc-section">
          <div className="dc-section-title"><i className="bx bx-user" /> Клиент</div>
          <div className="dc-row"><span>Получатель</span><strong>{check.clientName || "—"}</strong></div>
          {check.clientCompany && (
            <div className="dc-row"><span>Компания</span><strong>{check.clientCompany}</strong></div>
          )}
          {check.clientPhone && (
            <div className="dc-row"><span>Телефон</span><strong>{check.clientPhone}</strong></div>
          )}
          {check.orderCreatedAt && (
            <div className="dc-row"><span>Заказ создан</span><strong>{fmtDate(check.orderCreatedAt)}</strong></div>
          )}
        </div>

        <div className="dc-divider" />

        <div className="dc-section">
          <div className="dc-section-title"><i className="bx bx-car" /> Курьер</div>
          <div className="dc-row"><span>Водитель</span><strong>{check.courierName || "—"}</strong></div>
          {check.courierPhone && (
            <div className="dc-row"><span>Телефон</span><strong>{check.courierPhone}</strong></div>
          )}
          <div className="dc-row"><span>Транспорт</span><strong>{check.vehicleModel || "—"} {check.vehiclePlate ? `· ${check.vehiclePlate}` : ""}</strong></div>
        </div>
      </div>

      {/* Footer */}
      <div className="dc-check-footer">
        <div className="dc-footer-company">
          <i className="bx bx-phone" /> {COMPANY.phone}
          <span className="dc-footer-sep" />
          <i className="bx bx-envelope" /> {COMPANY.email}
          <span className="dc-footer-sep" />
          <i className="bx bx-map" /> {COMPANY.address}
        </div>
        <div className="dc-stamp">
          <div className="dc-stamp-inner">
            <i className="bx bx-check-double" />
            <span>Доставлено</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryChecks() {
  const { routeId } = useParams();
  const navigate    = useNavigate();

  const [checks,  setChecks]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    axiosClient.get(`/logist/routes/${routeId}/checks`)
      .then(r => setChecks(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [routeId]);

  /* Generate DOCX using docx library via CDN */
  const handlePrintDocx = async () => {
    setPrinting(true);
    try {
      // Load docx library from CDN if not loaded
      if (!window.docx) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      // Load FileSaver
      if (!window.saveAs) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
      } = window.docx;

      const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
      const borders = { top: border, bottom: border, left: border, right: border };
      const noBorders = {
        top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      };

      const makeRow = (label, value) => new TableRow({
        children: [
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            borders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
            children: [new Paragraph({
              children: [new TextRun({ text: label, bold: true, size: 20, font: "Arial" })]
            })]
          }),
          new TableCell({
            width: { size: 6000, type: WidthType.DXA },
            borders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({
              children: [new TextRun({ text: value || "—", size: 20, font: "Arial" })]
            })]
          }),
        ]
      });

      const children = [];

      // Company header
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: COMPANY.name, bold: true, size: 36, font: "Arial", color: "1A7A4A" })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: COMPANY.tagline, size: 18, font: "Arial", color: "888888", italics: true })],
          spacing: { after: 40 },
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `${COMPANY.phone}  ·  ${COMPANY.email}  ·  ${COMPANY.address}`, size: 16, font: "Arial", color: "888888" })],
          spacing: { after: 240 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1A7A4A" } },
        })
      );

      // Each check
      checks.forEach((check, i) => {
        if (i > 0) {
          children.push(new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: 400 },
            border: { bottom: { style: BorderStyle.DASHED, size: 3, color: "CCCCCC" } } }));
        }

        // Check header
        children.push(
          new Paragraph({
            children: [new TextRun({
              text: `ЧЕК ДОСТАВКИ #${check.orderId || check.pointId}  ·  ${fmtDateTime(check.actualArrival || check.plannedArrival)}`,
              bold: true, size: 24, font: "Arial", color: "1A7A4A",
            })],
            spacing: { before: 240, after: 160 },
          })
        );

        // Маршрут
        children.push(
          new Paragraph({ children: [new TextRun({ text: "МАРШРУТ", bold: true, size: 20, font: "Arial", color: "555555" })],
            spacing: { before: 160, after: 80 } })
        );
        children.push(new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [3000, 6000],
          rows: [
            makeRow("Откуда", check.pickupAddress),
            makeRow("Куда", check.deliveryAddress || check.address),
            makeRow("Точка маршрута №", String(check.sequenceNumber)),
            makeRow("Плановое прибытие", fmtDateTime(check.plannedArrival)),
            makeRow("Фактическое прибытие", fmtDateTime(check.actualArrival)),
          ],
        }));

        // Клиент
        children.push(
          new Paragraph({ children: [new TextRun({ text: "КЛИЕНТ", bold: true, size: 20, font: "Arial", color: "555555" })],
            spacing: { before: 200, after: 80 } })
        );
        children.push(new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [3000, 6000],
          rows: [
            makeRow("Получатель", check.clientName),
            ...(check.clientCompany ? [makeRow("Компания", check.clientCompany)] : []),
            makeRow("Телефон клиента", check.clientPhone),
            makeRow("Заказ создан", fmtDate(check.orderCreatedAt)),
          ],
        }));

        // Курьер
        children.push(
          new Paragraph({ children: [new TextRun({ text: "КУРЬЕР", bold: true, size: 20, font: "Arial", color: "555555" })],
            spacing: { before: 200, after: 80 } })
        );
        children.push(new Table({
          width: { size: 9000, type: WidthType.DXA },
          columnWidths: [3000, 6000],
          rows: [
            makeRow("Водитель", check.courierName),
            makeRow("Телефон водителя", check.courierPhone),
            makeRow("Транспорт", `${check.vehicleModel || "—"} ${check.vehiclePlate ? `(${check.vehiclePlate})` : ""}`),
          ],
        }));

        // Stamp area
        children.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "✓  ДОСТАВЛЕНО", bold: true, size: 28, font: "Arial", color: "16A34A" })],
            spacing: { before: 200, after: 80 },
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 },
            }
          },
          children,
        }]
      });

      const buffer = await Packer.toBlob(doc);
      window.saveAs(buffer, `delivery_checks_route_${routeId}.docx`);
    } catch (err) {
      console.error("DOCX error:", err);
      alert("Ошибка генерации документа");
    } finally {
      setPrinting(false);
    }
  };

  if (loading) return (
    <LogistLayout>
      <div className="dc-root">
        <div className="dc-skels">{[1,2].map(i => <div key={i} className="dc-skel" />)}</div>
      </div>
    </LogistLayout>
  );

  return (
    <LogistLayout>
      <div className="dc-root">

        <button className="dc-back" onClick={() => navigate(`/logist/routes/${routeId}`)}>
          <i className="bx bx-arrow-back" /> К маршруту #{routeId}
        </button>

        <div className="dc-hero">
          <div>
            <h1 className="dc-title">Чеки доставки</h1>
            <p className="dc-sub">
              Маршрут #{routeId} · {checks.length} {checks.length === 1 ? "доставка" : checks.length < 5 ? "доставки" : "доставок"}
            </p>
          </div>
          <button className="dc-print-btn" onClick={handlePrintDocx} disabled={printing || checks.length === 0}>
            <i className={`bx ${printing ? "bx-loader-alt dc-spin" : "bx-download"}`} />
            {printing ? "Генерируем..." : "Скачать .docx"}
          </button>
        </div>

        {checks.length === 0 ? (
          <div className="dc-empty">
            <i className="bx bx-file" />
            <p>Нет завершённых доставок по этому маршруту</p>
            <span>Чеки появятся когда курьер отметит точки как «Посещена»</span>
          </div>
        ) : (
          <div className="dc-list">
            {checks.map((c, i) => <CheckCard key={c.pointId} check={c} idx={i} />)}
          </div>
        )}
      </div>
    </LogistLayout>
  );
}