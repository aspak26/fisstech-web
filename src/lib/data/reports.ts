import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseWithItems } from "./expenses";
import type {
  IncomesRow,
  FixedExpensesRow,
  SubscriptionsRow,
  IncomeCategoriesRow,
  FixedExpenseCategoriesRow,
  InstallmentPlansRow,
} from "@/lib/types/database";
import type { UserDebtRow } from "./debts";
import type { GoalRow } from "./goals";
import { normalizeStoreName } from "./analytics";
import { paymentDate, effectivePaidCount } from "@/lib/expenses/installment";

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
  incomeCategoryMap: Map<string, IncomeCategoriesRow>;
  fixedCategoryMap: Map<string, FixedExpenseCategoriesRow>;
}

export async function getReportData(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string,
): Promise<ReportData> {
  const SAFETY_LIMIT = 5000;
  
  // 1. Fetch installments first to distribute them correctly
  const { data: instData } = await supabase.from("installment_plans").select("*").eq("user_id", userId);
  const installments = (instData ?? []) as InstallmentPlansRow[];
  
  const fromDate = new Date(`${start}T00:00:00`);
  const toDate = new Date(`${end}T23:59:59`);
  
  const allInstallmentIds = new Set<string>();
  const activeInstallmentData = new Map<string, { amount: number; labelSuffix: string }>();

  for (const inst of installments) {
    allInstallmentIds.add(inst.expense_id);
    let monthlyTotal = 0;
    const paidSuffixes: string[] = [];
    
    for (let i = 0; i < inst.total_count; i++) {
      const d = paymentDate(inst.start_date, i);
      if (d >= fromDate && d <= toDate) {
        const isPaid = inst.paid_states ? inst.paid_states[i] : effectivePaidCount(inst) > i;
        if (isPaid) {
          monthlyTotal += inst.monthly_amount;
          paidSuffixes.push(`${i + 1}/${inst.total_count}`);
        }
      }
    }
    
    if (monthlyTotal > 0) {
      activeInstallmentData.set(inst.expense_id, {
        amount: monthlyTotal,
        labelSuffix: ` (Taksit ${paidSuffixes.join(", ")})`,
      });
    }
  }

  // 2. Fetch everything else
  const [expensesRes, incomesRes, fixedRes, debtsRes, goalsRes, subsRes, categoriesRes, incomeCatRes, fixedCatRes] =
    await Promise.allSettled([
      supabase
        .from("expenses")
        .select("*, expense_items(*)")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .limit(SAFETY_LIMIT),
      supabase
        .from("incomes")
        .select("*")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .limit(SAFETY_LIMIT),
      supabase.from("fixed_expenses").select("*").eq("user_id", userId),
      supabase
        .from("user_debts")
        .select("*")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end)
        .limit(SAFETY_LIMIT),
      supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59`)
        .limit(SAFETY_LIMIT),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("categories").select("id, name"),
      supabase.from("income_categories").select("*"),
      supabase.from("fixed_expense_categories").select("*"),
    ]);

  const boundedExpenses =
    expensesRes.status === "fulfilled" ? ((expensesRes.value.data ?? []) as ExpenseWithItems[]) : [];
    
  // 3. Fetch missing installment expenses
  const missingIds = Array.from(activeInstallmentData.keys()).filter(id => !boundedExpenses.some(e => e.id === id));
  let extraExpenses: ExpenseWithItems[] = [];
  if (missingIds.length > 0) {
     for (let i = 0; i < missingIds.length; i += 100) {
       const chunk = missingIds.slice(i, i + 100);
       const { data } = await supabase.from("expenses").select("*, expense_items(*)").in("id", chunk);
       if (data) extraExpenses.push(...(data as ExpenseWithItems[]));
     }
  }
  
  const rawExpenses = [...boundedExpenses, ...extraExpenses];
  
  // 4. Map expenses to fix installment amounts
  const expenses = rawExpenses.map(expense => {
    const activeData = activeInstallmentData.get(expense.id);
    if (activeData) {
      const itemsCount = expense.expense_items.length || 1;
      return {
        ...expense,
        total: activeData.amount,
        store_name: expense.store_name ? `${expense.store_name}${activeData.labelSuffix}` : `Taksitli Harcama${activeData.labelSuffix}`,
        expense_items: expense.expense_items.map(item => ({
          ...item,
          price: activeData.amount / itemsCount,
          name: `${item.name}${activeData.labelSuffix}`,
        })),
      };
    } else if (allInstallmentIds.has(expense.id)) {
      // It's an installment but no payment falls in this period.
      return null;
    }
    return expense;
  }).filter(Boolean) as ExpenseWithItems[];

  const incomes = incomesRes.status === "fulfilled" ? ((incomesRes.value.data ?? []) as IncomesRow[]) : [];
  const fixedExpenses = fixedRes.status === "fulfilled" ? ((fixedRes.value.data ?? []) as FixedExpensesRow[]) : [];
  const debts = debtsRes.status === "fulfilled" ? ((debtsRes.value.data ?? []) as UserDebtRow[]) : [];
  const goals = goalsRes.status === "fulfilled" ? ((goalsRes.value.data ?? []) as GoalRow[]) : [];
  const allSubs = subsRes.status === "fulfilled" ? ((subsRes.value.data ?? []) as SubscriptionsRow[]) : [];
  const categories = categoriesRes.status === "fulfilled" ? (categoriesRes.value.data as { id: string; name: string }[] | null) ?? [] : [];
  const incomeCategories = incomeCatRes.status === "fulfilled" ? ((incomeCatRes.value.data ?? []) as IncomeCategoriesRow[]) : [];
  const fixedCategories = fixedCatRes.status === "fulfilled" ? ((fixedCatRes.value.data ?? []) as FixedExpenseCategoriesRow[]) : [];

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
    incomeCategoryMap: new Map(incomeCategories.map((c) => [c.id, c])),
    fixedCategoryMap: new Map(fixedCategories.map((c) => [c.id, c])),
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

export function expensesByStore(data: ReportData): CategoryTotal[] {
  const map = new Map<string, number>();
  for (const expense of data.expenses) {
    const raw = expense.store_name?.trim();
    const name = !raw ? "Manuel Giriş" : normalizeStoreName(raw);
    map.set(name, (map.get(name) ?? 0) + Number(expense.total));
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
