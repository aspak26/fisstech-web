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

// ─── Raporlar ───────────────────────────────────────────────────────────────

export interface EsnafMonthlyPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export async function getEsnafMonthlyTrend(
  supabase: SupabaseClient,
  businessId: string,
  months = 6,
): Promise<EsnafMonthlyPoint[]> {
  const monthKeys: string[] = [];
  let cursor = currentMonthString();
  for (let i = 0; i < months; i++) {
    monthKeys.unshift(cursor);
    cursor = shiftMonth(cursor, -1);
  }
  const points = await Promise.all(
    monthKeys.map(async (month) => {
      const { start, end } = getMonthRange(month);
      const totals = await getMonthlyTotals(supabase, businessId, start, end);
      return { month, label: formatMonthLabel(month), ...totals, net: totals.income - totals.expense };
    }),
  );
  return points;
}

export interface VatSummary {
  collected: number;
  paid: number;
  net: number;
}

export async function getVatSummary(
  supabase: SupabaseClient,
  businessId: string,
  start: string,
  end: string,
): Promise<VatSummary> {
  try {
    const [incomeRes, expenseRes] = await Promise.all([
      supabase
        .from("business_incomes")
        .select("vat_amount")
        .eq("business_id", businessId)
        .gte("transaction_date", start)
        .lte("transaction_date", end),
      supabase
        .from("business_expenses")
        .select("vat_amount")
        .eq("business_id", businessId)
        .gte("expense_date", start)
        .lte("expense_date", end),
    ]);
    const collected = (incomeRes.data ?? []).reduce((s, r) => s + Number(r.vat_amount), 0);
    const paid = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.vat_amount), 0);
    return { collected, paid, net: collected - paid };
  } catch {
    return { collected: 0, paid: 0, net: 0 };
  }
}

export interface ExpenseCategoryTotal {
  category: string;
  total: number;
}

export async function getExpensesByCategory(
  supabase: SupabaseClient,
  businessId: string,
  start: string,
  end: string,
): Promise<ExpenseCategoryTotal[]> {
  try {
    const { data } = await supabase
      .from("business_expenses")
      .select("category, amount")
      .eq("business_id", businessId)
      .gte("expense_date", start)
      .lte("expense_date", end);
    const map = new Map<string, number>();
    for (const row of data ?? []) {
      map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount));
    }
    return [...map.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
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
  await supabase.from("business_incomes").delete().eq("id", id);
}

export async function deleteBusinessExpense(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("business_expenses").delete().eq("id", id);
}

// ─── Faturalar ──────────────────────────────────────────────────────────────

export async function getInvoices(
  supabase: SupabaseClient,
  businessId: string,
): Promise<InvoiceRow[]> {
  try {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", businessId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("invoice_date", { ascending: false });
    return (data ?? []) as InvoiceRow[];
  } catch {
    return [];
  }
}

export async function deleteInvoice(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("invoices").delete().eq("id", id);
}

export async function markInvoicePaid(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase
    .from("invoices")
    .update({ status: "odendi", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
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
  await supabase.from("employees").delete().eq("id", id);
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
  await supabase
    .from("salary_payments")
    .update({ is_paid: isPaid, payment_date: isPaid ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);
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
  await supabase.from("stock_items").delete().eq("id", id);
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
  await supabase.from("stock_items").update({ current_qty: newQty }).eq("id", item.id);
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
  await supabase.from("menu_categories").delete().eq("id", id);
}

export async function deleteMenuItem(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("menu_items").delete().eq("id", id);
}

// ─── Evrak Arşivi (tüm sektörler) ──────────────────────────────────────────
// Taranan belgeler, fatura kaydı olarak `invoices` tablosuna (image_url dolu)
// yazılır — mobil şemada ayrı bir "documents" tablosu yok, invoices.image_url
// zaten bu amaç için var.

export async function getInvoicesWithImage(
  supabase: SupabaseClient,
  businessId: string,
): Promise<InvoiceRow[]> {
  try {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", businessId)
      .not("image_url", "is", null)
      .order("invoice_date", { ascending: false });
    return (data ?? []) as InvoiceRow[];
  } catch {
    return [];
  }
}
