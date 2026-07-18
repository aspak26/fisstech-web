import type { SupabaseClient } from "@supabase/supabase-js";
import { calculatePeriodRange } from "@/lib/utils/period";

export interface GroupRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export async function getGroups(supabase: SupabaseClient): Promise<GroupRow[]> {
  try {
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    return (data ?? []) as GroupRow[];
  } catch {
    return [];
  }
}

export async function getGroup(supabase: SupabaseClient, id: string): Promise<GroupRow | null> {
  const { data } = await supabase.from("groups").select("*").eq("id", id).maybeSingle();
  return (data as GroupRow) ?? null;
}

export async function createGroup(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("groups")
    .insert({ name, owner_id: userId })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Grup oluşturulamadı");

  await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: userId,
    role: "owner",
  });

  return data.id as string;
}

export interface GroupExpenseRow {
  id: string;
  store_name: string | null;
  total: number;
  date: string;
  user_id: string;
}

export async function getExpenseGroupIds(
  supabase: SupabaseClient,
  expenseId: string,
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("expense_groups")
      .select("group_id")
      .eq("expense_id", expenseId);
    return ((data ?? []) as { group_id: string }[]).map((r) => r.group_id);
  } catch {
    return [];
  }
}

/** Best-effort — mirrors mobile's assignExpenseToGroups: replaces the
 * expense's group assignments and updates its visibility. Caller already
 * saved the expense itself; a failure here shouldn't be treated as the
 * whole save failing. */
export async function assignExpenseToGroups(
  supabase: SupabaseClient,
  expenseId: string,
  groupIds: string[],
  visibility: "public" | "group_only",
): Promise<void> {
  await supabase.from("expense_groups").delete().eq("expense_id", expenseId);
  if (groupIds.length > 0) {
    await supabase
      .from("expense_groups")
      .insert(groupIds.map((groupId) => ({ expense_id: expenseId, group_id: groupId })));
  }
  await supabase
    .from("expenses")
    .update({ visibility: groupIds.length > 0 ? visibility : "public" })
    .eq("id", expenseId);
}

export async function getGroupExpenses(
  supabase: SupabaseClient,
  groupId: string,
): Promise<GroupExpenseRow[]> {
  try {
    const { data } = await supabase
      .from("expense_groups")
      .select("expenses(id, store_name, total, date, user_id)")
      .eq("group_id", groupId);
    return ((data ?? []) as unknown as { expenses: GroupExpenseRow }[])
      .map((row) => row.expenses)
      .filter(Boolean)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export interface MemberSpendPoint {
  userId: string;
  name: string;
  total: number;
}

/** "ÜYE BAZLI HARCAMA" — per-member totals for a group's shared expenses in
 * the given period, ported from GroupService.getMemberSpendTotals. */
export async function getMemberSpendTotals(
  supabase: SupabaseClient,
  groupId: string,
  periodKey: string,
): Promise<MemberSpendPoint[]> {
  try {
    const range = calculatePeriodRange(periodKey);
    const expenses = await getGroupExpenses(supabase, groupId);
    const filtered = expenses.filter(
      (e) => (!range.start || e.date >= range.start) && (!range.end || e.date <= range.end),
    );

    const totals = new Map<string, number>();
    for (const e of filtered) totals.set(e.user_id, (totals.get(e.user_id) ?? 0) + Number(e.total));
    const userIds = [...totals.keys()];
    if (userIds.length === 0) return [];

    const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
    const nameMap = new Map(((users ?? []) as { id: string; name: string | null }[]).map((u) => [u.id, u.name]));

    return [...totals.entries()]
      .map(([userId, total]) => ({ userId, name: nameMap.get(userId) ?? "Kullanıcı", total }))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}
