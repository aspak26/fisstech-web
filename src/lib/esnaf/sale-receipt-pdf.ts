import { formatCurrency } from "@/lib/utils/currency";

/** Generates and downloads a simple sale receipt PDF — web equivalent of
 * mobile's SalePdfService.generateReceipt + native share sheet. Uses jsPDF
 * (client-side, no server round-trip) since the receipt is plain text/
 * numbers, not a design-heavy document.
 *
 * `jspdf` is lazy-loaded here (not at module top) so it doesn't ship in the
 * initial JS for every sale-wizard mount — only when a receipt is actually
 * downloaded. */
export async function downloadSaleReceipt(payload: {
  businessName: string;
  customerName: string;
  itemTitle: string;
  totalAmount: number;
  downPayment: number;
  paymentType: "tek_cekim" | "taksitli";
  installments: { installmentNo: number; amount: number; dueDate: string }[];
  saleDate: string;
  staffName: string | null;
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text(payload.businessName, 14, y);
  y += 10;
  doc.setFontSize(11);
  doc.text("Satış Makbuzu", 14, y);
  y += 10;
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 10;

  const rows: [string, string][] = [
    ["Tarih", payload.saleDate],
    ["Müşteri", payload.customerName],
    ["Ürün / Portföy", payload.itemTitle],
    ["Toplam Tutar", formatCurrency(payload.totalAmount)],
    ["Kapora / Peşinat", formatCurrency(payload.downPayment)],
    ["Ödeme Türü", payload.paymentType === "taksitli" ? "Taksitli" : "Tek Çekim"],
  ];
  if (payload.staffName) rows.push(["Satışı Yapan", payload.staffName]);

  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.text(`${label}:`, 14, y);
    doc.text(value, 70, y);
    y += 8;
  }

  if (payload.installments.length > 0) {
    y += 4;
    doc.setFontSize(12);
    doc.text("Taksit Planı", 14, y);
    y += 8;
    doc.setFontSize(10);
    for (const inst of payload.installments) {
      doc.text(`${inst.installmentNo}. Taksit — ${inst.dueDate} — ${formatCurrency(inst.amount)}`, 14, y);
      y += 6;
    }
  }

  const fileName = `Satis_Makbuzu_${payload.saleDate}.pdf`;
  doc.save(fileName);
}
