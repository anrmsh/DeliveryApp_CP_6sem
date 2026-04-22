// src/utils/deliveryCheckDoc.js

function fmtDocDate(val) {
  if (!val) return "«___» ________ 20__ г.";
  const s = val.endsWith("Z") || val.includes("+") ? val : val + "Z";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "«___» ________ 20__ г.";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDocDateTime(val) {
  if (!val) return "—";
  const s = val.endsWith("Z") || val.includes("+") ? val : val + "Z";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function loadLib(src, check) {
  return new Promise((resolve, reject) => {
    if (check()) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function generateDeliveryDoc(data) {
  await Promise.all([
    loadLib(
      "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js",
      () => !!window.docx
    ),
    loadLib(
      "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js",
      () => !!window.saveAs
    ),
  ]);

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, BorderStyle, WidthType, ShadingType } = window.docx;
  const saveAs = window.saveAs;

  const NONE  = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
  const THIN  = { style: BorderStyle.SINGLE, size: 6, color: "DBEAFE" };
  const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };

  const hdr = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: "1E3A5F", font: "Times New Roman" })],
    spacing: { before: 160, after: 80 },
  });

  const row = (label, value) => new TableRow({
    children: [
      new TableCell({
        borders: { top: THIN, bottom: THIN, left: NONE, right: NONE },
        shading: { type: ShadingType.SOLID, color: "F0F4FF" },
        width: { size: 35, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: "374151", font: "Times New Roman" })] })],
      }),
      new TableCell({
        borders: { top: THIN, bottom: THIN, left: NONE, right: NONE },
        width: { size: 65, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: String(value || "—"), size: 20, font: "Times New Roman" })] })],
      }),
    ],
  });

  const signRow = (label) => new TableRow({
    children: [
      new TableCell({
        borders: noBorders,
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [
          new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Times New Roman" }),
          new TextRun({ text: "____________________", size: 20, font: "Times New Roman" }),
        ]})],
      }),
      new TableCell({
        borders: noBorders,
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [
          new TextRun({ text: "Дата: ", bold: true, size: 20, font: "Times New Roman" }),
          new TextRun({ text: "________________", size: 20, font: "Times New Roman" }),
        ]})],
      }),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 1000, right: 800 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "ООО «ВелоГруз Экспресс»", bold: true, size: 36, color: "1E3A5F", font: "Times New Roman" })],
          alignment: AlignmentType.CENTER, spacing: { after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "г. Минск, пр-т Независимости, 32  ·  +375 (29) 800-04-25", size: 20, color: "6B7280", font: "Times New Roman" })],
          alignment: AlignmentType.CENTER, spacing: { after: 80 },
        }),

        new Paragraph({
          children: [new TextRun({ text: `АКТ ДОСТАВКИ № ${data.routeId}-${data.orderId}`, bold: true, size: 28, color: "1E3A5F", font: "Times New Roman" })],
          alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: fmtDocDate(data.routePlannedStart), size: 22, color: "374151", font: "Times New Roman" })],
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
        }),

        hdr("1. ИСПОЛНИТЕЛЬ"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          row("Компания",  "ООО «ВелоГруз Экспресс»"),
          row("Курьер",    data.courierName),
          row("Телефон",   data.courierPhone || "—"),
          row("Транспорт", [data.vehicleModel, data.vehiclePlate].filter(Boolean).join(" / ") || "—"),
        ]}),

        hdr("2. ЗАКАЗЧИК"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          row("Наименование", data.clientCompany || "Физическое лицо"),
          row("ФИО/Контакт",  data.clientName),
          row("Телефон",      data.clientPhone || "—"),
        ]}),

        hdr("3. ДОСТАВКА"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          row("Откуда",               data.pickupAddress),
          row("Куда",                 data.deliveryAddress),
          row("Начало маршрута",      fmtDocDateTime(data.routePlannedStart)),
          row("Плановое прибытие",    fmtDocDateTime(data.plannedArrival)),
          row("Фактическое прибытие", fmtDocDateTime(data.actualArrival)),
          row("Расстояние",           data.distanceKm ? `${data.distanceKm} км` : "—"),
        ]}),

        hdr("4. ГРУЗ"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          row("Вес",        data.weightKg ? `${data.weightKg} кг` : "—"),
          row("Описание",   data.comment || "Без описания"),
        ]}),

        hdr("5. СТОИМОСТЬ"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          row("Сумма к оплате", data.price ? `${parseFloat(data.price).toFixed(2)} BYN` : "—"),
        ]}),

        new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400 } }),
        hdr("6. ПОДПИСИ СТОРОН"),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
          signRow("Исполнитель (курьер)"),
          new TableRow({ children: [
            new TableCell({ borders: noBorders, columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: " ", size: 20 })] })] }),
          ]}),
          signRow("Заказчик (получатель)"),
        ]}),

        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({ children: [new TextRun({ text: "М.П.", bold: true, size: 22, font: "Times New Roman", color: "9CA3AF" })] }),
        new Paragraph({ spacing: { before: 200 } }),
        new Paragraph({
          children: [new TextRun({ text: `Документ сформирован: ${fmtDocDate(new Date().toISOString())}`, size: 18, color: "9CA3AF", font: "Times New Roman" })],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `act_delivery_${data.routeId}_${data.orderId}.docx`);
}