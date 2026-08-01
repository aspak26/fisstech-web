import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseItemsRow, ExpensesRow, InstallmentPlansRow } from "@/lib/types/database";
import { requireUserId } from "@/lib/utils/auth";

export interface ExpenseWithItems extends ExpensesRow {
  expense_items: ExpenseItemsRow[];
  installment: InstallmentPlansRow | null;
}

export async function getExpenses(
  supabase: SupabaseClient,
  userId: string,
  opts: { start?: string | null; end?: string | null; limit?: number } = {},
): Promise<ExpenseWithItems[]> {
  try {
    let query = supabase
      .from("expenses")
      .select("*, expense_items(*)")
      .eq("user_id", userId);
    if (opts.start) query = query.gte("date", opts.start);
    if (opts.end) query = query.lte("date", opts.end);

    const { data } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 300);

    const expenses = (data ?? []) as Omit<ExpenseWithItems, "installment">[];
    if (expenses.length === 0) return [];

    const { data: installments } = await supabase
      .from("installment_plans")
      .select("*")
      .eq("user_id", userId)
      .in(
        "expense_id",
        expenses.map((e) => e.id),
      );
    const installmentMap = new Map(
      ((installments ?? []) as InstallmentPlansRow[]).map((i) => [i.expense_id, i]),
    );

    return expenses.map((e) => ({ ...e, installment: installmentMap.get(e.id) ?? null }));
  } catch {
    return [];
  }
}

export async function deleteExpense(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("expenses").delete().eq("id", id).eq("user_id", userId);
}

export async function getExpenseById(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<ExpenseWithItems | null> {
  const { data } = await supabase
    .from("expenses")
    .select("*, expense_items(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const { data: installment } = await supabase
    .from("installment_plans")
    .select("*")
    .eq("expense_id", id)
    .maybeSingle();

  return { ...(data as Omit<ExpenseWithItems, "installment">), installment: installment ?? null };
}
