import type { SupabaseClient } from "@supabase/supabase-js";

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
