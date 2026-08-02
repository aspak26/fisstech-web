import type { SupabaseClient } from "@supabase/supabase-js";
import { calculatePeriodRange } from "@/lib/utils/period";
import { requireUserId } from "@/lib/utils/auth";
import { getUserPlanInfo, isPersonalPremium } from "@/lib/utils/entitlements";
import { CHART_COLORS, normalizeStoreName, parentGroupIcon, type CategoryBreakdownPoint, type StoreBreakdownPoint } from "@/lib/data/analytics";

/** Mirrors GroupService's owned-group cap in fisle_app (free=1, premium/aile=3). */
const FREE_OWNED_GROUP_LIMIT = 1;
const PREMIUM_OWNED_GROUP_LIMIT = 3;

export interface GroupRow {
  id: string;
  name: string;
  owner_id: string;
  avatar_url: string | null;
  total_limit: number | null;
  created_at: string;
}

/** Güvenlik denetimi bulgusu: davet oluşturma/rol değiştirme/üye çıkarma/
 * grup silme sadece RLS'e güveniyordu, uygulama tarafında grup sahibi/
 * yöneticisi olup olmadığına dair hiçbir kontrol yoktu. */
async function assertCanManageGroup(supabase: SupabaseClient, groupId: string): Promise<string> {
  const userId = await requireUserId(supabase);
  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();
  if (!data || (data.role !== "owner" && data.role !== "admin")) {
    throw new Error("Bu işlem için grup yöneticisi olmanız gerekiyor");
  }
  return userId;
}

async function assertIsGroupOwner(supabase: SupabaseClient, groupId: string): Promise<string> {
  const userId = await requireUserId(supabase);
  const { data } = await supabase.from("groups").select("owner_id").eq("id", groupId).maybeSingle();
  if (!data || data.owner_id !== userId) {
    throw new Error("Bu işlem için grup sahibi olmanız gerekiyor");
  }
  return userId;
}

export async function getGroups(supabase: SupabaseClient): Promise<GroupRow[]> {
  try {
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    return (data ?? []) as GroupRow[];
  } catch {
    return [];
  }
}

/** Güvenlik denetimi bulgusu: RLS zaten üye-olmayanları filtreliyor, ama bu
 * fonksiyon üyeliği açıkça doğrulamıyordu — defense-in-depth için ekleniyor
 * (bkz. assertCanManageGroup/assertIsBusinessOwner ile aynı desen). */
export async function getGroup(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<GroupRow | null> {
  const { data: membership } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", id)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle();
  if (!membership) return null;

  const { data } = await supabase.from("groups").select("*").eq("id", id).maybeSingle();
  return (data as GroupRow) ?? null;
}

export async function createGroup(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<string> {
  const { planType } = await getUserPlanInfo(supabase, userId);
  const limit = isPersonalPremium(planType) ? PREMIUM_OWNED_GROUP_LIMIT : FREE_OWNED_GROUP_LIMIT;
  const { count } = await supabase
    .from("groups")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId);
  if ((count ?? 0) >= limit) {
    throw new Error(
      isPersonalPremium(planType)
        ? `En fazla ${limit} grup oluşturabilirsiniz.`
        : `Ücretsiz planda en fazla ${limit} grup oluşturabilirsiniz. Daha fazlası için Premium'a geçin.`,
    );
  }

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
  const userId = await requireUserId(supabase);
  await supabase.from("expense_groups").delete().eq("expense_id", expenseId);
  if (groupIds.length > 0) {
    await supabase
      .from("expense_groups")
      .insert(groupIds.map((groupId) => ({ expense_id: expenseId, group_id: groupId })));
  }
  await supabase
    .from("expenses")
    .update({ visibility: groupIds.length > 0 ? visibility : "public" })
    .eq("id", expenseId)
    .eq("user_id", userId);
}

export async function getGroupExpenseById(supabase: SupabaseClient, expenseId: string): Promise<GroupExpenseRow | null> {
  try {
    const { data } = await supabase
      .from("expenses")
      .select("id, store_name, total, date, user_id")
      .eq("id", expenseId)
      .maybeSingle();
    return (data as GroupExpenseRow) ?? null;
  } catch {
    return null;
  }
}

export async function getGroupExpenses(
  supabase: SupabaseClient,
  groupId: string,
): Promise<GroupExpenseRow[]> {
  try {
    // Sıralama fetch SONRASI JS'te yapıldığı için burada küçük bir
    // .limit() yanlış (en eski) satırları keserdi — bunun yerine sadece
    // patolojik büyümeye karşı cömert bir güvenlik ağı uygulanıyor.
    const { data } = await supabase
      .from("expense_groups")
      .select("expenses(id, store_name, total, date, user_id)")
      .eq("group_id", groupId)
      .limit(1000);
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

// ─── Grup Analitiği (kategori/genel kategori/market dağılımı) ──────────────
// Bu üç grafik mobilde YOK — kullanıcı isteğiyle web'e özel eklendi.
// Kişisel Analiz sayfasındaki (analytics.ts) aynı hesaplama mantığı
// (pro-rata kalem dağılımı, mağaza adı normalizasyonu, üst kategori
// ikonları) burada grup bazlı harcamalara uygulanıyor — yeni bir mantık
// icat edilmedi, var olanı group_id kapsamına taşıdı.

interface GroupExpenseItemDetail {
  price: number;
  quantity: number;
  categories: { name: string; icon: string; parent_group: string | null } | { name: string; icon: string; parent_group: string | null }[] | null;
}
interface GroupExpenseDetail {
  total: number;
  store_name: string | null;
  date: string;
  expense_items: GroupExpenseItemDetail[];
}

/** Mobil `GroupService.contributeToGoal` (bkz. fisle_app migration 074,
 * `contribute_to_goal_atomic`) hedefe katkıyı gerçek bir harcama olarak
 * `"🎯 {hedef} katkısı"` store_name'iyle kaydediyor — bu, gerçek bir
 * market/mağaza değil. Paylaşılan backend yüzünden mobilde yapılan bir
 * katkı bu ekranda da görünür, o yüzden aynı filtre burada da uygulanmalı
 * (bkz. fisle_app lib/features/groups/models/group_model.dart aynı isimli fonksiyon). */
function isGoalContributionExpense(storeName: string | null): boolean {
  return storeName != null && storeName.startsWith("🎯 ") && storeName.endsWith(" katkısı");
}

async function getGroupExpenseDetails(
  supabase: SupabaseClient,
  groupId: string,
  periodKey: string,
): Promise<GroupExpenseDetail[]> {
  const range = calculatePeriodRange(periodKey);
  let query = supabase
    .from("expense_groups")
    .select("expenses!inner(total, store_name, date, expense_items(price, quantity, categories(name, icon, parent_group)))")
    .eq("group_id", groupId);
  if (range.start) query = query.gte("expenses.date", range.start);
  if (range.end) query = query.lte("expenses.date", range.end);

  const { data } = await query;
  return ((data ?? []) as unknown as { expenses: GroupExpenseDetail }[])
    .map((row) => row.expenses)
    .filter(Boolean)
    .filter((e) => !isGoalContributionExpense(e.store_name));
}

function groupBreakdown(
  expenses: GroupExpenseDetail[],
  by: "item" | "parent",
): CategoryBreakdownPoint[] {
  const grouped = new Map<string, { icon: string; total: number }>();
  const add = (name: string, icon: string, amount: number) => {
    const existing = grouped.get(name);
    grouped.set(name, { icon, total: (existing?.total ?? 0) + amount });
  };

  for (const expense of expenses) {
    const items = expense.expense_items ?? [];
    if (items.length === 0) {
      add("Diğer", "📦", Number(expense.total));
      continue;
    }
    const itemsSum = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
    for (const item of items) {
      const cat = Array.isArray(item.categories) ? (item.categories[0] ?? null) : item.categories;
      const name = by === "item" ? (cat?.name ?? "Diğer") : (cat?.parent_group ?? "Diğer");
      const icon = by === "item" ? (cat?.icon ?? "📦") : parentGroupIcon(cat?.parent_group ?? "Diğer");
      const raw = Number(item.price) * item.quantity;
      const amount = itemsSum > 0 ? raw * (Number(expense.total) / itemsSum) : raw;
      add(name, icon, amount);
    }
  }

  return [...grouped.entries()]
    .map(([name, { icon, total }], index) => ({ name, icon, color: CHART_COLORS[index % CHART_COLORS.length], total }))
    .sort((a, b) => b.total - a.total);
}

export async function getGroupCategoryBreakdown(
  supabase: SupabaseClient,
  groupId: string,
  periodKey: string,
): Promise<CategoryBreakdownPoint[]> {
  try {
    return groupBreakdown(await getGroupExpenseDetails(supabase, groupId, periodKey), "item");
  } catch {
    return [];
  }
}

export async function getGroupParentCategoryBreakdown(
  supabase: SupabaseClient,
  groupId: string,
  periodKey: string,
): Promise<CategoryBreakdownPoint[]> {
  try {
    return groupBreakdown(await getGroupExpenseDetails(supabase, groupId, periodKey), "parent");
  } catch {
    return [];
  }
}

export async function getGroupStoreBreakdown(
  supabase: SupabaseClient,
  groupId: string,
  periodKey: string,
): Promise<StoreBreakdownPoint[]> {
  try {
    const expenses = await getGroupExpenseDetails(supabase, groupId, periodKey);
    const totals = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const e of expenses) {
      const raw = e.store_name?.trim();
      const name = !raw ? "Manuel Giriş" : normalizeStoreName(raw);
      totals.set(name, (totals.get(name) ?? 0) + Number(e.total));
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...totals.entries()]
      .map(([name, total]) => ({ name, total, count: counts.get(name) ?? 0 }))
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
  await assertCanManageGroup(supabase, groupId);
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

export async function updateMemberRole(
  supabase: SupabaseClient,
  groupId: string,
  memberId: string,
  role: GroupRole,
): Promise<void> {
  await assertCanManageGroup(supabase, groupId);
  await supabase.from("group_members").update({ role }).eq("id", memberId).eq("group_id", groupId);
}

/** Soft-delete (left_at) — used for both "remove member" (owner/admin
 * acting on someone else) and "leave group" (acting on yourself), so the
 * permission check allows either: the caller removing themselves, or a
 * group owner/admin removing someone else. */
export async function removeMember(supabase: SupabaseClient, groupId: string, userId: string): Promise<void> {
  const callerId = await requireUserId(supabase);
  if (callerId !== userId) {
    await assertCanManageGroup(supabase, groupId);
  }
  await supabase
    .from("group_members")
    .update({ left_at: new Date().toISOString() })
    .eq("group_id", groupId)
    .eq("user_id", userId);
}

/** Hard delete — owner only, cascades to members/invites/messages/etc.
 * Mobile has no ownership-transfer flow; an owner can only delete the
 * group, never leave it while keeping it alive — replicated as-is rather
 * than inventing a transfer feature mobile doesn't have. */
export async function deleteGroup(supabase: SupabaseClient, groupId: string): Promise<void> {
  await assertIsGroupOwner(supabase, groupId);
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

/** Owner/admin only — deletes every message in the group. */
export async function clearGroupChat(supabase: SupabaseClient, groupId: string): Promise<void> {
  await assertCanManageGroup(supabase, groupId);
  await supabase.from("group_messages").delete().eq("group_id", groupId);
}

// ─── Harcama Paylaştırma (Split) ────────────────────────────────────────────

export interface ExpenseSplitMemberRow {
  id: string;
  split_id: string;
  user_id: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  userName: string;
}

export interface ExpenseSplitRow {
  id: string;
  expense_id: string;
  group_id: string;
  split_type: string;
  created_at: string;
  members: ExpenseSplitMemberRow[];
}

/** Ported from mobile's GroupSplitService — equal split only (the only mode
 * the mobile UI ever offers, despite the schema supporting percentage/fixed
 * too). Every group member gets a share, including whoever paid — mobile
 * doesn't exclude/auto-mark the payer, replicated as-is. */
export async function createEqualSplit(
  supabase: SupabaseClient,
  expenseId: string,
  groupId: string,
  memberUserIds: string[],
  totalAmount: number,
): Promise<void> {
  if (memberUserIds.length === 0) return;
  const each = totalAmount / memberUserIds.length;

  const { data: split, error } = await supabase
    .from("expense_splits")
    .insert({ expense_id: expenseId, group_id: groupId, split_type: "equal" })
    .select("id")
    .single();
  if (error || !split) throw error ?? new Error("Paylaştırma oluşturulamadı");

  await supabase.from("expense_split_members").insert(
    memberUserIds.map((userId) => ({ split_id: split.id, user_id: userId, amount: each, is_paid: false })),
  );
}

export async function getSplitsForExpense(supabase: SupabaseClient, expenseId: string): Promise<ExpenseSplitRow[]> {
  try {
    const { data } = await supabase
      .from("expense_splits")
      .select("id, expense_id, group_id, split_type, created_at, expense_split_members(id, split_id, user_id, amount, is_paid, paid_at, users(name))")
      .eq("expense_id", expenseId);

    interface MemberRow {
      id: string;
      split_id: string;
      user_id: string;
      amount: number;
      is_paid: boolean;
      paid_at: string | null;
      users: { name: string | null } | { name: string | null }[] | null;
    }
    interface Row {
      id: string;
      expense_id: string;
      group_id: string;
      split_type: string;
      created_at: string;
      expense_split_members: MemberRow[];
    }
    return ((data ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      expense_id: r.expense_id,
      group_id: r.group_id,
      split_type: r.split_type,
      created_at: r.created_at,
      members: r.expense_split_members.map((m) => {
        const user = Array.isArray(m.users) ? (m.users[0] ?? null) : m.users;
        return {
          id: m.id,
          split_id: m.split_id,
          user_id: m.user_id,
          amount: Number(m.amount),
          is_paid: m.is_paid,
          paid_at: m.paid_at,
          userName: user?.name ?? "Üye",
        };
      }),
    }));
  } catch {
    return [];
  }
}

/** Self-attested only (RLS restricts to the split member's own row) — not a
 * real payment/transfer, mirrors mobile exactly. */
export async function markSplitPaid(supabase: SupabaseClient, splitMemberId: string, userId: string): Promise<void> {
  await supabase
    .from("expense_split_members")
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq("id", splitMemberId)
    .eq("user_id", userId);
}

// ─── Yorumlar & Reaksiyonlar ────────────────────────────────────────────────

export interface ExpenseCommentRow {
  id: string;
  expense_id: string;
  user_id: string;
  content: string;
  created_at: string;
  userName: string;
}

export async function getComments(supabase: SupabaseClient, expenseId: string): Promise<ExpenseCommentRow[]> {
  try {
    const { data } = await supabase
      .from("expense_comments")
      .select("id, expense_id, user_id, content, created_at, users(name)")
      .eq("expense_id", expenseId)
      .order("created_at");
    interface Row {
      id: string;
      expense_id: string;
      user_id: string;
      content: string;
      created_at: string;
      users: { name: string | null } | { name: string | null }[] | null;
    }
    return ((data ?? []) as unknown as Row[]).map((r) => {
      const user = Array.isArray(r.users) ? (r.users[0] ?? null) : r.users;
      return { id: r.id, expense_id: r.expense_id, user_id: r.user_id, content: r.content, created_at: r.created_at, userName: user?.name ?? "Üye" };
    });
  } catch {
    return [];
  }
}

export async function addComment(supabase: SupabaseClient, expenseId: string, userId: string, content: string): Promise<void> {
  const trimmed = content.trim().slice(0, 1000);
  if (!trimmed) return;
  await supabase.from("expense_comments").insert({ expense_id: expenseId, user_id: userId, content: trimmed });
}

export async function deleteComment(supabase: SupabaseClient, commentId: string, userId: string): Promise<void> {
  await supabase.from("expense_comments").delete().eq("id", commentId).eq("user_id", userId);
}

export const REACTION_TYPES = ["like", "surprised", "laugh", "love"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];
export const REACTION_EMOJI: Record<ReactionType, string> = { like: "👍", surprised: "😮", laugh: "😂", love: "❤️" };

export interface ExpenseReactionRow {
  id: string;
  user_id: string;
  reaction: ReactionType;
  userName: string;
}

export async function getReactions(supabase: SupabaseClient, expenseId: string): Promise<ExpenseReactionRow[]> {
  try {
    const { data } = await supabase
      .from("expense_reactions")
      .select("id, user_id, reaction, users(name)")
      .eq("expense_id", expenseId);
    interface Row {
      id: string;
      user_id: string;
      reaction: ReactionType;
      users: { name: string | null } | { name: string | null }[] | null;
    }
    return ((data ?? []) as unknown as Row[]).map((r) => {
      const user = Array.isArray(r.users) ? (r.users[0] ?? null) : r.users;
      return { id: r.id, user_id: r.user_id, reaction: r.reaction, userName: user?.name ?? "Üye" };
    });
  } catch {
    return [];
  }
}

/** Toggles the caller's reaction — same reaction tapped again removes it,
 * a different one replaces it (one reaction per user per expense). */
export async function toggleReaction(
  supabase: SupabaseClient,
  expenseId: string,
  userId: string,
  reaction: ReactionType,
): Promise<void> {
  const { data: existing } = await supabase
    .from("expense_reactions")
    .select("id, reaction")
    .eq("expense_id", expenseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction === reaction) {
      await supabase.from("expense_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("expense_reactions").update({ reaction }).eq("id", existing.id);
    }
  } else {
    await supabase.from("expense_reactions").insert({ expense_id: expenseId, user_id: userId, reaction });
  }
}
