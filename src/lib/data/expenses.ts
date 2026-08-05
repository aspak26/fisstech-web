import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExpenseItemsRow, ExpensesRow, InstallmentPlansRow } from "@/lib/types/database";
import { requireUserId } from "@/lib/utils/auth";

export interface ExpenseWithItems extends ExpensesRow {
  expense_items: ExpenseItemsRow[];
  installment: InstallmentPlansRow | null;
  // Bu harcamanın paylaşıldığı grup(lar)ın adı — mobil taraftaki aynı
  // ihtiyaçtan doğdu (bkz. fisle_app Expense.groupNames): bir grup hedefine
  // yapılan katkı da dahil, gruba bağlı harcamalar kişisel listede hangi
  // gruba ait olduğu belirtilmeden "kayıp" görünüyordu.
  group_names: string[];
}

interface ExpenseGroupJoinRow {
  groups: { name: string } | { name: string }[] | null;
}

function extractGroupNames(rows: ExpenseGroupJoinRow[] | null | undefined): string[] {
  if (!rows) return [];
  return rows
    .map((r) => (Array.isArray(r.groups) ? r.groups[0] : r.groups))
    .map((g) => g?.name)
    .filter((n): n is string => Boolean(n));
}

export async function getExpenses(
  supabase: SupabaseClient,
  userId: string,
  opts: { start?: string | null; end?: string | null; limit?: number } = {},
): Promise<ExpenseWithItems[]> {
  try {
    let query = supabase
      .from("expenses")
      .select("*, expense_items(*), expense_groups(groups(name))")
      .eq("user_id", userId);
    if (opts.start) query = query.gte("date", opts.start);
    if (opts.end) query = query.lte("date", opts.end);

    const { data } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 300);

    const rawExpenses = (data ?? []) as (Omit<ExpenseWithItems, "installment" | "group_names"> & {
      expense_groups: ExpenseGroupJoinRow[] | null;
    })[];
    const expenses = rawExpenses.map(({ expense_groups, ...rest }) => ({
      ...rest,
      group_names: extractGroupNames(expense_groups),
    })) as Omit<ExpenseWithItems, "installment">[];
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
    .select("*, expense_items(*), expense_groups(groups(name))")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  const { expense_groups, ...rest } = data as Omit<ExpenseWithItems, "installment" | "group_names"> & {
    expense_groups: ExpenseGroupJoinRow[] | null;
  };

  const { data: installment } = await supabase
    .from("installment_plans")
    .select("*")
    .eq("expense_id", id)
    .maybeSingle();

  return {
    ...rest,
    group_names: extractGroupNames(expense_groups),
    installment: (installment as InstallmentPlansRow) ?? null,
  };
}

export async function getArchivedExpenses(
  supabase: SupabaseClient,
  userId: string,
  opts: { start?: string | null; end?: string | null } = {},
): Promise<ExpenseWithItems[]> {
  try {
    let query = supabase
      .from("expenses")
      .select("*, expense_items(*), expense_groups(groups(name))")
      .eq("user_id", userId)
      .not("receipt_image_url", "is", null);

    if (opts.start) query = query.gte("date", opts.start);
    if (opts.end) query = query.lte("date", opts.end);

    const { data } = await query
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    const rawExpenses = (data ?? []) as (Omit<ExpenseWithItems, "installment" | "group_names"> & {
      expense_groups: ExpenseGroupJoinRow[] | null;
    })[];
    
    // Sadece gerçekten image URL içerenleri (boş string olmayanları) filtrele
    const expenses = rawExpenses
      .filter((e) => e.receipt_image_url && e.receipt_image_url.trim().length > 0)
      .map(({ expense_groups, ...rest }) => ({
        ...rest,
        group_names: extractGroupNames(expense_groups),
      })) as Omit<ExpenseWithItems, "installment">[];
      
    if (expenses.length === 0) return [];

    return expenses.map((e) => ({ ...e, installment: null })); // Archive genelde taksit bilgisine ihtiyaç duymaz
  } catch {
    return [];
  }
}
