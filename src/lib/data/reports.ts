import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseWithItems } from "./expenses";
import type { IncomesRow, FixedExpensesRow, SubscriptionsRow } from "@/lib/types/database";
import type { UserDebtRow } from "./debts";
import type { GoalRow } from "./goals";

export interface ReportData {
  start: string;
  end: string;
  expenses: ExpenseWithItems[];
  incomes: IncomesRow[];
  fixedExpenses: FixedExpensesRow[];
  debts: UserDebtRow[];
  goals: GoalRow[];
  subscriptions: SubscriptionsRow[];
  categoryNamesByItemCategoryId: Map<string, string>;
}

/** Mirrors ReportService.generateReport() in fisle_app report_service.dart —
 * same tables, same period-filter semantics, each fetch fails soft. */
export async function getReportData(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
): Promise<ReportData> {
  const [expensesRes, incomesRes, fixedRes, debtsRes, goalsRes, subsRes, categoriesRes] =
    await Promise.allSettled([
      supabase
        .from("expenses")
        .select("*, expense_items(*)")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
      supabase.from("incomes").select("*").eq("user_id", userId).gte("date", start).lte("date", end),
      supabase.from("fixed_expenses").select("*").eq("user_id", userId),
      supabase
        .from("user_debts")
        .select("*")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59`),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("categories").select("id, name"),
    ]);

  const expenses =
    expensesRes.status === "fulfilled" ? ((expensesRes.value.data ?? []) as ExpenseWithItems[]) : [];
  const incomes =
    incomesRes.status === "fulfilled" ? ((incomesRes.value.data ?? []) as IncomesRow[]) : [];
  const fixedExpenses =
    fixedRes.status === "fulfilled" ? ((fixedRes.value.data ?? []) as FixedExpensesRow[]) : [];
  const debts = debtsRes.status === "fulfilled" ? ((debtsRes.value.data ?? []) as UserDebtRow[]) : [];
  const goals = goalsRes.status === "fulfilled" ? ((goalsRes.value.data ?? []) as GoalRow[]) : [];
  const allSubs =
    subsRes.status === "fulfilled" ? ((subsRes.value.data ?? []) as SubscriptionsRow[]) : [];
  const categories =
    categoriesRes.status === "fulfilled"
      ? (categoriesRes.value.data as { id: string; name: string }[] | null) ?? []
      : [];

  // Active subscriptions overlapping the period (mirrors mobile's filter).
  const subscriptions = allSubs.filter((s) => {
    const startsBefore = !s.start_date || s.start_date <= end;
    const endsAfter = !s.end_date || s.end_date >= start;
    return startsBefore && endsAfter;
  });

  return {
    start,
    end,
    expenses,
    incomes,
    fixedExpenses,
    debts,
    goals,
    subscriptions,
    categoryNamesByItemCategoryId: new Map(categories.map((c) => [c.id, c.name])),
  };
}

export function totalIncome(data: ReportData): number {
  return data.incomes.reduce((sum, i) => sum + Number(i.amount), 0);
}

export function totalExpense(data: ReportData): number {
  const regular = data.expenses.reduce((sum, e) => sum + Number(e.total), 0);
  const fixed = data.fixedExpenses.reduce((sum, f) => sum + Number(f.amount), 0);
  return regular + fixed;
}

export interface CategoryTotal {
  name: string;
  total: number;
}

export function expensesByCategory(data: ReportData): CategoryTotal[] {
  const map = new Map<string, number>();
  for (const expense of data.expenses) {
    if (expense.expense_items.length > 0) {
      for (const item of expense.expense_items) {
        const name = data.categoryNamesByItemCategoryId.get(item.category_id ?? "") ?? "Diğer";
        map.set(name, (map.get(name) ?? 0) + Number(item.price) * item.quantity);
      }
    } else {
      map.set("Diğer", (map.get("Diğer") ?? 0) + Number(expense.total));
    }
  }
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

export interface PurchasedItemRow {
  date: string;
  storeName: string;
  name: string;
  quantity: number;
  price: number;
}

export function purchasedItems(data: ReportData): PurchasedItemRow[] {
  const rows: PurchasedItemRow[] = [];
  for (const expense of data.expenses) {
    for (const item of expense.expense_items) {
      rows.push({
        date: expense.date,
        storeName: expense.store_name || "Bilinmiyor",
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
      });
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}
