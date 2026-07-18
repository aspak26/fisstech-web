import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseItemsRow, ExpensesRow } from "@/lib/types/database";

export interface ExpenseWithItems extends ExpensesRow {
  expense_items: ExpenseItemsRow[];
}

export async function getExpenses(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<ExpenseWithItems[]> {
  try {
    const { data } = await supabase
      .from("expenses")
      .select("*, expense_items(*)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as ExpenseWithItems[];
  } catch {
    return [];
  }
}

export async function deleteExpense(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("expenses").delete().eq("id", id);
}
