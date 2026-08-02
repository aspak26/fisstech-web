import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthRange } from "@/lib/utils/date";
import type {
  ExpensesRow,
  FixedExpensesRow,
  SubscriptionsRow,
  UserNotesRow,
} from "@/lib/types/database";

/** Every function here fails soft — a missing/empty table renders an empty
 * state instead of crashing the dashboard, matching the mobile app's
 * try/catch-per-tile resilience pattern in dashboard_screen.dart. */

export async function getMonthlyExpenseSummary(
  supabase: SupabaseClient,
  userId: string,
  month: string,
): Promise<{ total: number; count: number }> {
  try {
    const { start, end } = getMonthRange(month);
    const { data } = await supabase
      .from("expenses")
      .select("total")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    const rows = (data ?? []) as Pick<ExpensesRow, "total">[];
    return {
      total: rows.reduce((sum, r) => sum + Number(r.total), 0),
      count: rows.length,
    };
  } catch {
    return { total: 0, count: 0 };
  }
}

export async function getMonthlyIncomeTotal(
  supabase: SupabaseClient,
  userId: string,
  month: string,
): Promise<number> {
  try {
    const { start, end } = getMonthRange(month);
    const { data } = await supabase
      .from("incomes")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);
    return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  } catch {
    return 0;
  }
}

export async function getFixedExpenses(
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

export interface RecentExpense extends ExpensesRow {
  item_count: number;
  // bkz. lib/data/expenses.ts ExpenseWithItems.group_names aynı gerekçe —
  // grup hedefi katkısı gibi gruba bağlı harcamalar Pano'da hangi gruba ait
  // olduğu belirtilmeden görünmesin diye eklendi.
  group_names: string[];
}

export async function getRecentExpenses(
  supabase: SupabaseClient,
  userId: string,
  limit = 6,
): Promise<RecentExpense[]> {
  try {
    const { data } = await supabase
      .from("expenses")
      .select("*, expense_items(count), expense_groups(groups(name))")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => {
      const { expense_items, expense_groups, ...rest } = row as ExpensesRow & {
        expense_items: { count: number }[];
        expense_groups: { groups: { name: string } | { name: string }[] | null }[] | null;
      };
      const groupNames = (expense_groups ?? [])
        .map((r) => (Array.isArray(r.groups) ? r.groups[0] : r.groups))
        .map((g) => g?.name)
        .filter((n): n is string => Boolean(n));
      return { ...rest, item_count: expense_items?.[0]?.count ?? 0, group_names: groupNames };
    });
  } catch {
    return [];
  }
}

export async function getNotesTeaser(
  supabase: SupabaseClient,
  userId: string,
  limit = 3,
): Promise<UserNotesRow[]> {
  try {
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as UserNotesRow[];
  } catch {
    return [];
  }
}

export async function getActiveSubscriptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionsRow[]> {
  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("renewal_date");
    return (data ?? []) as SubscriptionsRow[];
  } catch {
    return [];
  }
}

export async function getGroupMembershipCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  try {
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("left_at", null);
    return count ?? 0;
  } catch {
    return 0;
  }
}
