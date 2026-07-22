import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FixedExpenseCategoriesRow,
  FixedExpensesRow,
  IncomeCategoriesRow,
  IncomesRow,
} from "@/lib/types/database";

export async function getIncomes(
  supabase: SupabaseClient,
  userId: string,
  range: { start?: string | null; end?: string | null } = {},
  limit = 300,
): Promise<IncomesRow[]> {
  try {
    let query = supabase.from("incomes").select("*").eq("user_id", userId);
    if (range.start) query = query.gte("date", range.start);
    if (range.end) query = query.lte("date", range.end);
    const { data } = await query.order("date", { ascending: false }).limit(limit);
    return (data ?? []) as IncomesRow[];
  } catch {
    return [];
  }
}

export async function getFixedExpensesFull(
  supabase: SupabaseClient,
  userId: string,
): Promise<FixedExpensesRow[]> {
  try {
    const { data } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("user_id", userId)
      .order("payment_day");
    return (data ?? []) as FixedExpensesRow[];
  } catch {
    return [];
  }
}

export async function getIncomeCategories(supabase: SupabaseClient): Promise<IncomeCategoriesRow[]> {
  const { data } = await supabase.from("income_categories").select("*").order("name");
  return (data ?? []) as IncomeCategoriesRow[];
}

export async function getFixedExpenseCategories(
  supabase: SupabaseClient,
): Promise<FixedExpenseCategoriesRow[]> {
  const { data } = await supabase.from("fixed_expense_categories").select("*").order("name");
  return (data ?? []) as FixedExpenseCategoriesRow[];
}

export async function deleteIncome(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("incomes").delete().eq("id", id);
}

export async function deleteFixedExpense(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("fixed_expenses").delete().eq("id", id);
}

export async function toggleFixedExpensePaid(
  supabase: SupabaseClient,
  id: string,
  isPaid: boolean,
): Promise<void> {
  await supabase
    .from("fixed_expenses")
    .update({ is_paid: isPaid, paid_date: isPaid ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id);
}
