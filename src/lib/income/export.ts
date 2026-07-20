import type {
  FixedExpenseCategoriesRow,
  FixedExpensesRow,
  IncomeCategoriesRow,
  IncomesRow,
} from "@/lib/types/database";
import type { ExpenseWithItems } from "@/lib/data/expenses";

const PAYMENT_LABELS_TR: Record<string, string> = {
  cash: "Nakit",
  credit_card: "Kredi Kartı",
  debit_card: "Banka Kartı",
  unknown: "Bilinmiyor",
  auto_payment: "Otomatik Ödeme",
  bank_transfer: "Banka Havalesi",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateTR(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function fileTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

/** Ported from mobile's ExportService.exportToExcel — same 5 sheets, same
 * columns, same NET BAKİYE formula (income - fixed - variable). Triggers a
 * browser download instead of the native share sheet.
 *
 * `xlsx` is lazy-loaded here (not at module top) so its ~600KB doesn't ship
 * in the initial JS for every /income page load — only when this is called. */
export async function exportBudgetToExcel({
  periodLabel,
  incomes,
  fixedExpenses,
  expenses,
  incomeCategoryMap,
  fixedCategoryMap,
  itemCategoryNamesById,
}: {
  periodLabel: string;
  incomes: IncomesRow[];
  fixedExpenses: FixedExpensesRow[];
  expenses: ExpenseWithItems[];
  incomeCategoryMap: Map<string, IncomeCategoriesRow>;
  fixedCategoryMap: Map<string, FixedExpenseCategoriesRow>;
  itemCategoryNamesById: Map<string, string>;
}) {
  const XLSX = await import("xlsx");
  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalFixed = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
  const totalVariable = expenses.reduce((s, e) => s + Number(e.total), 0);
  const net = totalIncome - totalFixed - totalVariable;

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Kategori", "Tutar"],
      ["Dönem", periodLabel],
      ["Toplam Gelir", totalIncome],
      ["Sabit Giderler", totalFixed],
      ["Değişken Giderler", totalVariable],
      ["NET BAKİYE", net],
    ]),
    "Özet",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Kategori", "Açıklama", "Tutar (₺)", "Tarih"],
      ...incomes.map((i) => {
        const cat = incomeCategoryMap.get(i.category_id ?? "");
        return [
          cat ? `${cat.icon} ${cat.name}` : "Gelir",
          i.description ?? "",
          Number(i.amount),
          formatDateTR(i.created_at),
        ];
      }),
    ]),
    "Gelirler",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Kategori", "Tutar (₺)", "Ödeme Günü", "Ödeme Yöntemi", "Ödendi"],
      ...fixedExpenses.map((f) => {
        const cat = fixedCategoryMap.get(f.category_id ?? "");
        return [
          cat ? `${cat.icon} ${cat.name}` : "Sabit gider",
          Number(f.amount),
          f.payment_day,
          PAYMENT_LABELS_TR[f.payment_method] ?? f.payment_method,
          f.is_paid ? "Evet" : "Hayır",
        ];
      }),
    ]),
    "Sabit Giderler",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Mağaza / Açıklama", "Tarih", "Ödeme Yöntemi", "Tutar (₺)"],
      ...expenses.map((e) => [
        e.store_name || "Bilinmeyen işyeri",
        e.date,
        PAYMENT_LABELS_TR[e.payment_method] ?? e.payment_method,
        Number(e.total),
      ]),
    ]),
    "Değişken Giderler",
  );

  const flattenedItems = expenses
    .flatMap((e) => e.expense_items.map((item) => ({ expense: e, item })))
    .sort((a, b) => (a.expense.date < b.expense.date ? 1 : -1));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Tarih", "Mağaza", "Ürün Adı", "Kategori", "Adet", "Toplam Tutar (₺)"],
      ...flattenedItems.map(({ expense, item }) => [
        expense.date,
        expense.store_name || "Bilinmeyen işyeri",
        item.name,
        itemCategoryNamesById.get(item.category_id ?? "") ?? "Diğer",
        item.quantity,
        Number(item.price) * item.quantity,
      ]),
    ]),
    "Satın Alınan Ürünler",
  );

  XLSX.writeFile(wb, `Fisstech_${fileTimestamp()}.xlsx`);
}
