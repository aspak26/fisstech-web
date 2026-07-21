import type { SupabaseClient } from "@supabase/supabase-js";
import { calculatePeriodRange } from "@/lib/utils/period";

export interface GroupRow {
  id: string;
  name: string;
  owner_id: string;
  avatar_url: string | null;
  total_limit: number | null;
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

// ─── Davet / Katılma ────────────────────────────────────────────────────────

/** Ported from mobile's _parseToken — accepts either a raw token or a full
 * `.../join/<token>` link pasted into the manual code-entry dialog. */
export function parseInviteToken(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("/join/")) {
    const tokenPart = trimmed.split("/join/")[1]?.split("?")[0]?.split("/")[0];
    if (tokenPart) return tokenPart.trim();
  }
  return trimmed;
}

export interface InvitePreview {
  groupId: string;
  groupName: string;
  status: "pending" | "accepted" | "expired" | "rejected";
  expiresAt: string;
}

/** Ported from mobile's GroupService.createInvite — expires any existing
 * pending invite for the group first (single-active-invite-per-group). */
export async function createInvite(supabase: SupabaseClient, groupId: string, userId: string): Promise<string> {
  await supabase
    .from("group_invites")
    .update({ status: "expired" })
    .eq("group_id", groupId)
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("group_invites")
    .insert({ group_id: groupId, created_by: userId })
    .select("token")
    .single();
  if (error || !data) throw error ?? new Error("Davet oluşturulamadı");
  return data.token as string;
}

/** Uses the get_invite_preview RPC (docs/sql/049_group_invite_preview.sql)
 * rather than a direct SELECT — see that file for why. */
export async function getInvitePreview(supabase: SupabaseClient, token: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc("get_invite_preview", { p_token: token });
  if (error || !data || data.length === 0) return null;
  const row = data[0] as { group_id: string; group_name: string; status: string; expires_at: string };
  return { groupId: row.group_id, groupName: row.group_name, status: row.status as InvitePreview["status"], expiresAt: row.expires_at };
}

/** Calls the accept_group_invite RPC — SECURITY DEFINER, handles the
 * member-cap check (2 for free-plan owners, 6 for premium/trial) and the
 * actual group_members insert server-side. Throws with the RPC's message
 * on failure (invite invalid/expired, cap reached, already a member). */
export async function acceptInvite(supabase: SupabaseClient, token: string): Promise<void> {
  const { error } = await supabase.rpc("accept_group_invite", { p_token: token });
  if (error) throw error;
}

// ─── Üyeler ──────────────────────────────────────────────────────────────────

export type GroupRole = "owner" | "admin" | "member";

export interface GroupMemberRow {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  customAlias: string | null;
}

/** Ported from mobile's GroupService.getMembers — active members
 * (left_at IS NULL) with the caller's private aliases (user_aliases)
 * overlaid, exactly like mobile's displayName resolution. */
export async function getMembers(
  supabase: SupabaseClient,
  groupId: string,
  currentUserId: string,
): Promise<GroupMemberRow[]> {
  try {
    const { data } = await supabase
      .from("group_members")
      .select("id, group_id, user_id, role, joined_at, users(name, email, avatar_url)")
      .eq("group_id", groupId)
      .is("left_at", null)
      .order("joined_at");

    interface Row {
      id: string;
      group_id: string;
      user_id: string;
      role: GroupRole;
      joined_at: string;
      users: { name: string | null; email: string | null; avatar_url: string | null } | { name: string | null; email: string | null; avatar_url: string | null }[] | null;
    }
    const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
      ...r,
      users: Array.isArray(r.users) ? (r.users[0] ?? null) : r.users,
    }));

    const { data: aliasRows } = await supabase
      .from("user_aliases")
      .select("target_user_id, alias_name")
      .eq("user_id", currentUserId);
    const aliasMap = new Map(((aliasRows ?? []) as { target_user_id: string; alias_name: string }[]).map((a) => [a.target_user_id, a.alias_name]));

    return rows.map((r) => ({
      id: r.id,
      groupId: r.group_id,
      userId: r.user_id,
      role: r.role,
      joinedAt: r.joined_at,
      name: aliasMap.get(r.user_id) ?? r.users?.name ?? r.users?.email ?? "Kullanıcı",
      email: r.users?.email ?? null,
      avatarUrl: r.users?.avatar_url ?? null,
      customAlias: aliasMap.get(r.user_id) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function updateMemberRole(supabase: SupabaseClient, memberId: string, role: GroupRole): Promise<void> {
  await supabase.from("group_members").update({ role }).eq("id", memberId);
}

/** Soft-delete (left_at) — used for both "remove member" (owner/admin
 * acting on someone else) and "leave group" (acting on yourself). */
export async function removeMember(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  await supabase
    .from("group_members")
    .update({ left_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("user_id", userId);
}

/** Hard delete — owner only (enforced by RLS), cascades to members/invites/
 * messages/etc. Mobile has no ownership-transfer flow; an owner can only
 * delete the group, never leave it while keeping it alive — replicated
 * as-is rather than inventing a transfer feature mobile doesn't have. */
export async function deleteGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  await supabase.from("groups").delete().eq("id", groupId);
}

export async function saveUserAlias(
  supabase: SupabaseClient,
  userId: string,
  targetUserId: string,
  aliasName: string,
): Promise<void> {
  const trimmed = aliasName.trim();
  if (!trimmed) {
    await deleteUserAlias(supabase, userId, targetUserId);
    return;
  }
  await supabase
    .from("user_aliases")
    .upsert({ user_id: userId, target_user_id: targetUserId, alias_name: trimmed }, { onConflict: "user_id, target_user_id" });
}

export async function deleteUserAlias(supabase: SupabaseClient, userId: string, targetUserId: string): Promise<void> {
  await supabase.from("user_aliases").delete().eq("user_id", userId).eq("target_user_id", targetUserId);
}

// ─── Sohbet ──────────────────────────────────────────────────────────────────

export interface GroupMessageRow {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

/** Ported from mobile's GroupService.getMessages — initial page load only;
 * new messages after that arrive via Realtime (see useGroupChatRealtime). */
export async function getMessages(supabase: SupabaseClient, groupId: string, limit = 60): Promise<GroupMessageRow[]> {
  try {
    const { data } = await supabase
      .from("group_messages")
      .select("id, group_id, user_id, content, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as GroupMessageRow[]).reverse();
  } catch {
    return [];
  }
}

export async function sendMessage(supabase: SupabaseClient, groupId: string, userId: string, content: string): Promise<void> {
  const trimmed = content.trim().slice(0, 2000);
  if (!trimmed) return;
  await supabase.from("group_messages").insert({ group_id: groupId, user_id: userId, content: trimmed });
}

export async function deleteMessage(supabase: SupabaseClient, id: string, userId: string): Promise<void> {
  await supabase.from("group_messages").delete().eq("id", id).eq("user_id", userId);
}

/** Owner/admin only (RLS-enforced) — deletes every message in the group. */
export async function clearGroupChat(supabase: SupabaseClient, groupId: string): Promise<void> {
  await supabase.from("group_messages").delete().eq("group_id", groupId);
}
