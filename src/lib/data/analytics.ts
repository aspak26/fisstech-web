import type { SupabaseClient } from "@supabase/supabase-js";
import type { InstallmentPlansRow } from "@/lib/types/database";
import { calculatePeriodRange } from "@/lib/utils/period";
import { formatMonthLabel, shiftMonth, currentMonthString } from "@/lib/utils/date";
import { paymentDate as installmentPaymentDate, effectivePaidCount } from "@/lib/expenses/installment";

export interface CategoryBreakdownPoint {
  name: string;
  icon?: string;
  color: string;
  total: number;
}

export interface StoreBreakdownPoint {
  name: string;
  total: number;
  count: number;
}

export interface MonthlyTotalPoint {
  month: string;
  label: string;
  total: number;
}

export const CHART_COLORS = [
  "#B23A65",
  "#2E7D32",
  "#1E88E5",
  "#F5A623",
  "#8E44AD",
  "#16A085",
  "#D35400",
  "#546E7A",
  "#C0392B",
  "#00897B",
];

const PARENT_GROUP_ICON: Record<string, string> = {
  "Yiyecek & İçecek": "🍽️",
  "Market & Alışveriş": "🛒",
  "Ulaşım": "🚗",
  "Sağlık & Güzellik": "💊",
  "Eğlence & Hobi": "🎮",
  "Faturalar & Hizmetler": "📄",
  "Eğitim": "📚",
  "Giyim & Aksesuar": "👕",
  "Elektronik & Teknoloji": "💻",
  "Ev & Yaşam": "🏠",
  "Finans & Sigorta": "💰",
  "Seyahat": "✈️",
  "Spor & Fitness": "💪",
  "Çocuk & Bebek": "👶",
  "Evcil Hayvan": "🐾",
  "Abonelikler": "📱",
};

export function parentGroupIcon(group: string): string {
  return PARENT_GROUP_ICON[group] ?? "📦";
}

export function normalizeStoreName(raw: string): string {
  const l = raw.toLowerCase();
  if (l.includes("bim")) return "BİM";
  if (l.includes("şok") || (l.includes("sok") && l.includes("market"))) return "ŞOK";
  if (l.includes("a101") || l.includes("a 101")) return "A101";
  if (l.includes("migros")) return "Migros";
  if (l.includes("carrefour") || l.includes("carerefour")) return "CarrefourSA";
  if (l.includes("macro") && l.includes("center")) return "Macro Center";
  if (l.includes("teknosa")) return "Teknosa";
  if (l.includes("mediamarkt") || (l.includes("media") && l.includes("markt"))) return "MediaMarkt";
  if (l.includes("lc waikiki") || l.includes("lcwaikiki")) return "LC Waikiki";
  if (l.includes("zara")) return "Zara";
  if (l.includes("hepsiburada")) return "Hepsiburada";
  if (l.includes("trendyol")) return "Trendyol";
  if (l.includes("getir")) return "Getir";
  if (l.includes("yemeksepeti")) return "Yemeksepeti";
  if (l.includes("cepte") || l.includes("morhipo")) return "Morhipo";
  return raw.trim();
}

interface ActiveSubscription {
  amount: number;
  frequency: "monthly" | "yearly";
  start_date: string | null;
  end_date: string | null;
}

function subMonthlyAmount(sub: ActiveSubscription): number {
  return sub.frequency === "yearly" ? Number(sub.amount) / 12 : Number(sub.amount);
}

async function fetchActiveSubscriptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveSubscription[]> {
  const { data } = await supabase
    .from("subscriptions")
    .select("amount, frequency, start_date, end_date")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data ?? []) as ActiveSubscription[];
}

function subActiveInMonth(startDate: string | null, endDate: string | null, monthKey: string): boolean {
  const [y, m] = monthKey.split("-").map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 1);
  if (startDate && new Date(startDate) >= monthEnd) return false;
  if (endDate && new Date(endDate) < monthStart) return false;
  return true;
}

/** Scales a subscription's monthly cost to the selected period's length —
 * ported from AnalyticsService._subMultiplier. */
function subMultiplier(periodKey: string): number {
  if (periodKey === "week") return 7 / 30;
  if (periodKey === "month" || periodKey === "last_month" || periodKey.startsWith("month_")) return 1;
  if (periodKey === "last3months" || periodKey === "month3") return 3;
  if (periodKey === "last6months" || periodKey === "month6") return 6;
  if (
    periodKey === "year" ||
    periodKey === "year_cur" ||
    periodKey.startsWith("year_") ||
    periodKey === "last_year" ||
    periodKey === "all"
  ) {
    return 12;
  }
  const range = calculatePeriodRange(periodKey);
  if (!range.start || !range.end) return 12;
  const days = (new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000 + 1;
  return days / 30;
}

/** Sum of a taksitli harcama's PAID installments whose due date falls
 * within [from, to) — ported from _installmentBoundedAmount. */
function installmentBoundedAmount(inst: InstallmentPlansRow, from: Date | null, to: Date): number {
  let total = 0;
  for (let i = 0; i < inst.total_count; i++) {
    const date = installmentPaymentDate(inst.start_date, i);
    if (from && date < from) continue;
    if (date >= to) continue;
    const isPaid = inst.paid_states
      ? inst.paid_states[i]
      : effectivePaidCount(inst) > i; // legacy fallback, same ordering as mobile's date comparison
    if (isPaid) total += inst.monthly_amount;
  }
  return total;
}

interface ExpenseForBreakdown {
  id: string;
  total: number;
  expense_items: { price: number; quantity: number; categories: { name: string; icon: string; parent_group: string | null } | null }[];
}

interface BreakdownData {
  expenses: ExpenseForBreakdown[];
  installmentMap: Map<string, InstallmentPlansRow>;
  activeSubs: Awaited<ReturnType<typeof fetchActiveSubscriptions>>;
  from: Date | null;
  to: Date;
  periodKey: string;
}

/** expenses + installment_plans + subscriptions'ı BİR kez çeker — item-bazlı
 * ve parent-bazlı gruplama (aşağıdaki groupBreakdown) aynı bu veriden
 * hesaplanır. Önceden getCategoryBreakdown/getParentCategoryBreakdown ikisi
 * de bağımsız olarak aynı fetch'i tekrarlıyordu (bkz. docs/PROGRESS.md). */
async function fetchBreakdownData(
  supabase: SupabaseClient,
  userId: string,
  periodKey: string,
): Promise<BreakdownData> {
  const range = calculatePeriodRange(periodKey);
  const now = new Date();
  const from = range.start ? new Date(`${range.start}T00:00:00`) : null;
  // Cap open-ended periods at the start of next month so future unpaid
  // installments never bleed into "Tüm Zamanlar".
  const to = range.end
    ? new Date(`${range.end}T23:59:59`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let expensesQuery = supabase
    .from("expenses")
    .select("id, total, expense_items(price, quantity, categories(name, icon, parent_group))")
    .eq("user_id", userId);
  if (range.start) expensesQuery = expensesQuery.gte("date", range.start);
  if (range.end) expensesQuery = expensesQuery.lte("date", range.end);

  const [expensesRes, installmentsRes, activeSubs] = await Promise.all([
    expensesQuery,
    supabase.from("installment_plans").select("*").eq("user_id", userId),
    fetchActiveSubscriptions(supabase, userId),
  ]);

  const expenses = (expensesRes.data ?? []) as unknown as ExpenseForBreakdown[];
  const installmentMap = new Map(
    ((installmentsRes.data ?? []) as InstallmentPlansRow[]).map((i) => [i.expense_id, i]),
  );

  return { expenses, installmentMap, activeSubs, from, to, periodKey };
}

function groupBreakdown(data: BreakdownData, groupBy: "item" | "parent"): CategoryBreakdownPoint[] {
  const { expenses, installmentMap, activeSubs, from, to, periodKey } = data;
  const grouped = new Map<string, { icon: string; total: number }>();
  const add = (name: string, icon: string, amount: number) => {
    const existing = grouped.get(name);
    grouped.set(name, { icon, total: (existing?.total ?? 0) + amount });
  };
  const groupLabel = (cat: { name: string; icon: string; parent_group: string | null } | null) => {
    if (groupBy === "item") return { name: cat?.name ?? "Diğer", icon: cat?.icon ?? "📦" };
    const group = cat?.parent_group ?? "Diğer";
    return { name: group, icon: parentGroupIcon(group) };
  };

  for (const expense of expenses) {
    const inst = installmentMap.get(expense.id);
    if (inst) {
      const amount = installmentBoundedAmount(inst, from, to);
      if (amount > 0) {
        const first = expense.expense_items[0]?.categories ?? null;
        const { name, icon } = first ? groupLabel(first) : { name: "Taksitler", icon: "📋" };
        add(name, icon, amount);
      }
      continue;
    }

    const items = expense.expense_items ?? [];
    if (items.length === 0) {
      add("Diğer", "📦", Number(expense.total));
      continue;
    }
    const itemsSum = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    for (const item of items) {
      const { name, icon } = groupLabel(item.categories);
      const raw = Number(item.price) * item.quantity;
      const amount = itemsSum > 0 ? raw * (Number(expense.total) / itemsSum) : raw;
      add(name, icon, amount);
    }
  }

  const multiplier = subMultiplier(periodKey);
  const subTotal = activeSubs.reduce((s, sub) => s + subMonthlyAmount(sub) * multiplier, 0);
  if (subTotal > 0) add("Abonelikler", "📱", subTotal);

  const grand = [...grouped.values()].reduce((s, e) => s + e.total, 0);
  if (grand === 0) return [];

  return [...grouped.entries()]
    .map(([name, { icon, total }], index) => ({
      name,
      icon,
      color: CHART_COLORS[index % CHART_COLORS.length],
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface CategoryBreakdowns {
  item: CategoryBreakdownPoint[];
  parent: CategoryBreakdownPoint[];
}

/** Item-bazlı ve parent-bazlı kırılımı TEK fetch'ten üretir — önceden
 * getCategoryBreakdown/getParentCategoryBreakdown ayrı ayrı çağrıldığında
 * (analytics/page.tsx'in tek çağıranı) aynı expenses/installment_plans/
 * subscriptions verisi 2 kez sorgulanıyordu. */
export async function getCategoryBreakdowns(
  supabase: SupabaseClient,
  userId: string,
  periodKey: string,
): Promise<CategoryBreakdowns> {
  const data = await fetchBreakdownData(supabase, userId, periodKey);
  return { item: groupBreakdown(data, "item"), parent: groupBreakdown(data, "parent") };
}

export async function getStoreBreakdown(
  supabase: SupabaseClient,
  userId: string,
  periodKey: string,
): Promise<StoreBreakdownPoint[]> {
  const range = calculatePeriodRange(periodKey);
  let query = supabase.from("expenses").select("total, store_name").eq("user_id", userId);
  if (range.start) query = query.gte("date", range.start);
  if (range.end) query = query.lte("date", range.end);

  const { data } = await query;
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { total: number; store_name: string | null }[]) {
    const raw = row.store_name?.trim();
    const name = !raw ? "Manuel Giriş" : normalizeStoreName(raw);
    totals.set(name, (totals.get(name) ?? 0) + Number(row.total));
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...totals.entries()]
    .map(([name, total]) => ({ name, total, count: counts.get(name) ?? 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Last 6 calendar months' expense totals — installments distributed to
 * their (paid) payment months, subscriptions to every month they were
 * active in, regular expenses to their purchase month. Ported from
 * AnalyticsService.getMonthlyTrend's "son 6 ay" branch (used for every
 * common period preset). */
export async function getMonthlyExpenseTrend(
  supabase: SupabaseClient,
  userId: string,
  months = 6,
): Promise<MonthlyTotalPoint[]> {
  const monthKeys: string[] = [];
  let cursor = currentMonthString();
  for (let i = 0; i < months; i++) {
    monthKeys.unshift(cursor);
    cursor = shiftMonth(cursor, -1);
  }
  const firstMonthStart = `${monthKeys[0]}-01`;

  const [expensesRes, installmentsRes, activeSubs] = await Promise.all([
    supabase.from("expenses").select("id, total, date").eq("user_id", userId).gte("date", firstMonthStart),
    supabase.from("installment_plans").select("*").eq("user_id", userId),
    fetchActiveSubscriptions(supabase, userId),
  ]);

  const expenses = (expensesRes.data ?? []) as { id: string; total: number; date: string }[];
  const installments = (installmentsRes.data ?? []) as InstallmentPlansRow[];
  const installmentIds = new Set(installments.map((i) => i.expense_id));

  const monthly = new Map<string, number>();
  const bump = (key: string, amount: number) => monthly.set(key, (monthly.get(key) ?? 0) + amount);

  for (const inst of installments) {
    for (let i = 0; i < inst.total_count; i++) {
      const date = installmentPaymentDate(inst.start_date, i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthKeys.includes(key)) continue;
      const isPaid = inst.paid_states ? inst.paid_states[i] : effectivePaidCount(inst) > i;
      if (isPaid) bump(key, inst.monthly_amount);
    }
  }

  for (const expense of expenses) {
    if (installmentIds.has(expense.id)) continue;
    const key = expense.date.slice(0, 7);
    bump(key, Number(expense.total));
  }

  for (const sub of activeSubs) {
    const amount = subMonthlyAmount(sub);
    for (const key of monthKeys) {
      if (subActiveInMonth(sub.start_date, sub.end_date, key)) bump(key, amount);
    }
  }

  return monthKeys.map((key) => ({ month: key, label: formatMonthLabel(key), total: monthly.get(key) ?? 0 }));
}
