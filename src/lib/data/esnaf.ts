import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BusinessExpenseRow,
  BusinessIncomeRow,
  BusinessServiceChipRow,
  EmployeeRow,
  InvoiceRow,
  SalaryPaymentRow,
  StockItemRow,
  StockMovementRow,
} from "@/lib/types/esnaf";
import { currentMonthString, formatMonthLabel, getMonthRange, shiftMonth } from "@/lib/utils/date";
import { CHART_COLORS } from "@/lib/data/analytics";
import { requireUserId } from "@/lib/utils/auth";

export async function updateBusinessWhatsAppTemplates(
  supabase: SupabaseClient,
  businessId: string,
  templates: Record<string, string>,
): Promise<void> {
  const userId = await requireUserId(supabase);
  const { error } = await supabase
    .from("businesses")
    .update({ whatsapp_templates: templates })
    .eq("id", businessId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ─── Raporlar ───────────────────────────────────────────────────────────────

export interface EsnafMonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface VatSummary {
  collected: number;
  paid: number;
  net: number;
}

export interface ExpenseCategoryTotal {
  category: string;
  total: number;
}

export interface IncomeItemSeries {
  key: string;
  label: string;
  color: string;
}

export interface IncomeItemPoint {
  date: string;
  label: string;
  total: number;
  [seriesKey: string]: string | number;
}

export interface IncomeItemTrend {
  points: IncomeItemPoint[];
  series: IncomeItemSeries[];
}

const OTHER_KEY = "sOther";

export interface EsnafPeriodIncomeRow {
  amount: number;
  vat_amount: number;
  chip_label: string | null;
  description: string | null;
  transaction_date: string;
}

export interface EsnafPeriodExpenseRow {
  amount: number;
  vat_amount: number;
  category: string;
  expense_date: string;
}

export interface EsnafPeriodData {
  incomes: EsnafPeriodIncomeRow[];
  expenses: EsnafPeriodExpenseRow[];
}

/** business_incomes + business_expenses'i [start,end] için TEK sorgu
 * çiftiyle (tablo başına bir kez) çeker. Raporlar sayfasının ihtiyaç
 * duyduğu 4 görünüm (aylık trend, KDV özeti, gider kategorileri, gelir
 * kalemi zaman çizelgesi) bu tek veri kümesinden saf fonksiyonlarla
 * (deriveMonthlyTrend/deriveVatSummary/vb.) türetilir — her biri kendi
 * sorgusunu atmaz. Önceden aynı sayfa yüklemesi ~16 ayrı round-trip
 * atıyordu (6 aylık döngü × 2 tablo + 3 görünümün her biri kendi
 * sorgusu), bkz. docs/PROGRESS.md. */
export async function getEsnafPeriodData(
  supabase: SupabaseClient,
  businessId: string,
  start: string,
  end: string,
): Promise<EsnafPeriodData> {
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from("business_incomes")
        .select("amount, vat_amount, chip_label, description, transaction_date")
        .eq("business_id", businessId)
        .gte("transaction_date", start)
        .lte("transaction_date", end),
      supabase
        .from("business_expenses")
        .select("amount, vat_amount, category, expense_date")
        .eq("business_id", businessId)
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);
    return {
      incomes: (incomeRes.data ?? []) as EsnafPeriodIncomeRow[],
      expenses: (expenseRes.data ?? []) as EsnafPeriodExpenseRow[],
    };
  } catch {
    return { incomes: [], expenses: [] };
  }
}

export function filterEsnafPeriodData(data: EsnafPeriodData, start: string, end: string): EsnafPeriodData {
  return {
    incomes: data.incomes.filter((r) => r.transaction_date >= start && r.transaction_date <= end),
    expenses: data.expenses.filter((r) => r.expense_date >= start && r.expense_date <= end),
  };
}

export function deriveMonthlyTrend(data: EsnafPeriodData, monthKeys: string[]): EsnafMonthlyPoint[] {
  const income = new Map<string, number>();
  const expense = new Map<string, number>();
  for (const r of data.incomes) {
    const key = r.transaction_date.slice(0, 7);
    income.set(key, (income.get(key) ?? 0) + Number(r.amount));
  }
  for (const r of data.expenses) {
    const key = r.expense_date.slice(0, 7);
    expense.set(key, (expense.get(key) ?? 0) + Number(r.amount));
  }
  return monthKeys.map((month) => {
    const inc = income.get(month) ?? 0;
    const exp = expense.get(month) ?? 0;
    return { month, label: formatMonthLabel(month), income: inc, expense: exp, net: inc - exp };
  });
}

export function deriveVatSummary(data: EsnafPeriodData): VatSummary {
  const collected = data.incomes.reduce((s, r) => s + Number(r.vat_amount), 0);
  const paid = data.expenses.reduce((s, r) => s + Number(r.vat_amount), 0);
  return { collected, paid, net: collected - paid };
}

export function deriveExpensesByCategory(data: EsnafPeriodData): ExpenseCategoryTotal[] {
  const map = new Map<string, number>();
  for (const row of data.expenses) {
    map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount));
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Gün × üst-N gelir kalemi (chip_label/description) olarak gruplar.
 * Mobildeki get_product_sales/get_daily_sales_trend RPC'leri sadece
 * order_items (kafe/restoran) üzerinden çalışıyor, tüm sektörlerde
 * (hizmet/toptan/freelance/satis) karşılığı yok — business_incomes ise
 * her sektörde gerçekten dolan tek tablo olduğu için onun üzerinden
 * kuruldu (bkz. docs/PROGRESS.md). */
export function deriveIncomeItemTrend(data: EsnafPeriodData, topN = 5): IncomeItemTrend {
  const labelOf = (r: { chip_label: string | null; description: string | null }) =>
    (r.chip_label || r.description || "Diğer").trim() || "Diğer";

  const totalsByLabel = new Map<string, number>();
  for (const r of data.incomes) {
    const l = labelOf(r);
    totalsByLabel.set(l, (totalsByLabel.get(l) ?? 0) + Number(r.amount));
  }
  const ranked = [...totalsByLabel.entries()].sort((a, b) => b[1] - a[1]);
  const topLabels = new Set(ranked.slice(0, topN).map(([l]) => l));
  const series: IncomeItemSeries[] = ranked
    .slice(0, topN)
    .map(([label], i) => ({ key: `s${i}`, label, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const keyByLabel = new Map(series.map((s) => [s.label, s.key]));
  const hasOther = ranked.length > topN;

  const byDate = new Map<string, IncomeItemPoint>();
  for (const r of data.incomes) {
    const date = r.transaction_date;
    const label = labelOf(r);
    const key = topLabels.has(label) ? keyByLabel.get(label)! : OTHER_KEY;
    const point = byDate.get(date) ?? { date, label: String(Number(date.slice(8, 10))), total: 0 };
    point[key] = Number(point[key] ?? 0) + Number(r.amount);
    point.total = Number(point.total) + Number(r.amount);
    byDate.set(date, point);
  }

  const allSeries = hasOther
    ? [...series, { key: OTHER_KEY, label: "Diğer", color: "var(--color-text-secondary)" }]
    : series;
  return {
    points: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    series: allSeries,
  };
}

export interface EsnafRaporlarBundle {
  trend: EsnafMonthlyPoint[];
  vat: VatSummary;
  categories: ExpenseCategoryTotal[];
  incomeItemTrend: IncomeItemTrend;
}

/** Raporlar sayfasının tek giriş noktası — 4 görünümü topluca üretir,
 * sayfa kendi başına ayrı ayrı sorgu atmaz (bkz. getEsnafPeriodData). */
export async function getEsnafRaporlarBundle(
  supabase: SupabaseClient,
  businessId: string,
  months = 6,
): Promise<EsnafRaporlarBundle> {
  const monthKeys: string[] = [];
  let cursor = currentMonthString();
  for (let i = 0; i < months; i++) {
    monthKeys.unshift(cursor);
    cursor = shiftMonth(cursor, -1);
  }
  const { start: periodStart } = getMonthRange(monthKeys[0]);
  const { start: curStart, end: curEnd } = getMonthRange(monthKeys[monthKeys.length - 1]);

  const periodData = await getEsnafPeriodData(supabase, businessId, periodStart, curEnd);
  const trend = deriveMonthlyTrend(periodData, monthKeys);
  const currentMonthData = filterEsnafPeriodData(periodData, curStart, curEnd);

  return {
    trend,
    vat: deriveVatSummary(currentMonthData),
    categories: deriveExpensesByCategory(currentMonthData),
    incomeItemTrend: deriveIncomeItemTrend(currentMonthData, 5),
  };
}

// ─── Kasa (income/expense) ─────────────────────────────────────────────────

export interface DailyTotals {
  income: number;
  expense: number;
  count: number;
}

export async function getDailyTotals(
  supabase: SupabaseClient,
  businessId: string,
  date: string,
): Promise<DailyTotals> {
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from("business_incomes")
        .select("amount")
        .eq("business_id", businessId)
        .eq("transaction_date", date),
      supabase
        .from("business_expenses")
        .select("amount")
        .eq("business_id", businessId)
        .eq("expense_date", date),
    ]);
    const incomeRows = incomeRes.data ?? [];
    const income = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
    const expense = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return { income, expense, count: incomeRows.length };
  } catch {
    return { income: 0, expense: 0, count: 0 };
  }
}

export async function getBusinessIncomes(
  supabase: SupabaseClient,
  businessId: string,
  limit = 100,
): Promise<BusinessIncomeRow[]> {
  try {
    const { data } = await supabase
      .from("business_incomes")
      .select("*")
      .eq("business_id", businessId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as BusinessIncomeRow[];
  } catch {
    return [];
  }
}

export async function getBusinessExpenses(
  supabase: SupabaseClient,
  businessId: string,
  limit = 100,
): Promise<BusinessExpenseRow[]> {
  try {
    const { data } = await supabase
      .from("business_expenses")
      .select("*")
      .eq("business_id", businessId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as BusinessExpenseRow[];
  } catch {
    return [];
  }
}

export async function getServiceChips(
  supabase: SupabaseClient,
  businessId: string,
): Promise<BusinessServiceChipRow[]> {
  const { data } = await supabase
    .from("business_service_chips")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order");
  return (data ?? []) as BusinessServiceChipRow[];
}

export async function getMonthlyTotals(
  supabase: SupabaseClient,
  businessId: string,
  start: string,
  end: string,
): Promise<{ income: number; expense: number }> {
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from("business_incomes")
        .select("amount")
        .eq("business_id", businessId)
        .gte("transaction_date", start)
        .lte("transaction_date", end),
      supabase
        .from("business_expenses")
        .select("amount")
        .eq("business_id", businessId)
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);
    const income = (incomeRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const expense = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    return { income, expense };
  } catch {
    return { income: 0, expense: 0 };
  }
}

export async function deleteBusinessIncome(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("business_incomes").delete().eq("id", id).eq("user_id", userId);
}

export async function deleteBusinessExpense(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("business_expenses").delete().eq("id", id).eq("user_id", userId);
}

// ─── Faturalar ──────────────────────────────────────────────────────────────

export async function getInvoices(
  supabase: SupabaseClient,
  businessId: string,
  limit = 200,
): Promise<InvoiceRow[]> {
  try {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", businessId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("invoice_date", { ascending: false })
      .limit(limit);
    return (data ?? []) as InvoiceRow[];
  } catch {
    return [];
  }
}

export async function deleteInvoice(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("invoices").delete().eq("id", id).eq("user_id", userId);
}

export async function markInvoicePaid(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("invoices")
    .update({ status: "odendi", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("user_id", userId);
}

// ─── Personel & Maaş ────────────────────────────────────────────────────────

export async function getEmployees(
  supabase: SupabaseClient,
  businessId: string,
): Promise<EmployeeRow[]> {
  try {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("business_id", businessId)
      .order("is_active", { ascending: false })
      .order("full_name");
    return (data ?? []) as EmployeeRow[];
  } catch {
    return [];
  }
}

export async function deleteEmployee(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("employees").delete().eq("id", id).eq("user_id", userId);
}

export async function getSalaryPayments(
  supabase: SupabaseClient,
  businessId: string,
  month: string,
): Promise<SalaryPaymentRow[]> {
  try {
    const { data } = await supabase
      .from("salary_payments")
      .select("*")
      .eq("business_id", businessId)
      .eq("payment_month", month);
    return (data ?? []) as SalaryPaymentRow[];
  } catch {
    return [];
  }
}

/** Ensures a salary_payments row exists for every active employee for the
 * given month — mirrors mobile's EmployeeService.ensureSalaryRecords(). */
export async function ensureSalaryRecords(
  supabase: SupabaseClient,
  businessId: string,
  userId: string,
  employees: EmployeeRow[],
  month: string,
): Promise<void> {
  const existing = await getSalaryPayments(supabase, businessId, month);
  const existingEmployeeIds = new Set(existing.map((s) => s.employee_id));
  const missing = employees.filter((e) => e.is_active && !existingEmployeeIds.has(e.id));
  if (missing.length === 0) return;
  await supabase.from("salary_payments").insert(
    missing.map((e) => ({
      employee_id: e.id,
      business_id: businessId,
      user_id: userId,
      amount: e.salary,
      payment_month: month,
      is_paid: false,
    })),
  );
}

export async function toggleSalaryPaid(
  supabase: SupabaseClient,
  id: string,
  isPaid: boolean,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("salary_payments")
    .update({ is_paid: isPaid, payment_date: isPaid ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id)
    .eq("user_id", userId);
}

// ─── Stok ───────────────────────────────────────────────────────────────────

export async function getStockItems(
  supabase: SupabaseClient,
  businessId: string,
): Promise<StockItemRow[]> {
  try {
    const { data } = await supabase
      .from("stock_items")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as StockItemRow[];
  } catch {
    return [];
  }
}

export async function deleteStockItem(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("stock_items").delete().eq("id", id).eq("user_id", userId);
}

export async function getStockMovements(
  supabase: SupabaseClient,
  stockItemId: string,
): Promise<StockMovementRow[]> {
  const { data } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("stock_item_id", stockItemId)
    .order("movement_date", { ascending: false })
    .limit(20);
  return (data ?? []) as StockMovementRow[];
}

/** Atomically applies a stock movement and updates current_qty — mirrors
 * mobile's StockService.addMovement(). giris adds, cikis subtracts, sayim sets. */
export async function addStockMovement(
  supabase: SupabaseClient,
  userId: string,
  item: StockItemRow,
  type: "giris" | "cikis" | "sayim",
  quantity: number,
  note?: string,
): Promise<void> {
  const newQty =
    type === "giris"
      ? Number(item.current_qty) + quantity
      : type === "cikis"
        ? Number(item.current_qty) - quantity
        : quantity;

  await supabase.from("stock_movements").insert({
    stock_item_id: item.id,
    business_id: item.business_id,
    user_id: userId,
    movement_type: type,
    quantity,
    note: note || null,
  });
  await supabase.from("stock_items").update({ current_qty: newQty }).eq("id", item.id).eq("user_id", userId);
}

// ─── Menü Yönetimi (sadece Yeme & İçme / business_type='kafe') ────────────────

export interface MenuCategoryRow {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItemRow {
  id: string;
  business_id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  price: number;
  prep_minutes: number;
  is_active: boolean;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
}

export async function getMenuCategories(
  supabase: SupabaseClient,
  businessId: string,
): Promise<MenuCategoryRow[]> {
  try {
    const { data } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("business_id", businessId)
      .order("sort_order");
    return (data ?? []) as MenuCategoryRow[];
  } catch {
    return [];
  }
}

export async function getMenuItems(
  supabase: SupabaseClient,
  businessId: string,
): Promise<MenuItemRow[]> {
  try {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as MenuItemRow[];
  } catch {
    return [];
  }
}

export async function deleteMenuCategory(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("menu_categories").delete().eq("id", id).eq("user_id", userId);
}

export async function deleteMenuItem(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("menu_items").delete().eq("id", id).eq("user_id", userId);
}

// ─── Evrak Arşivi (tüm sektörler) ──────────────────────────────────────────
// Taranan belgeler, fatura kaydı olarak `invoices` tablosuna (image_url dolu)
// yazılır — mobil şemada ayrı bir "documents" tablosu yok, invoices.image_url
// zaten bu amaç için var.

export async function getInvoicesWithImage(
  supabase: SupabaseClient,
  businessId: string,
  limit = 200,
): Promise<InvoiceRow[]> {
  try {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", businessId)
      .not("image_url", "is", null)
      .order("invoice_date", { ascending: false })
      .limit(limit);
    return (data ?? []) as InvoiceRow[];
  } catch {
    return [];
  }
}
