import type { SupabaseClient } from "@supabase/supabase-js";

export interface GoalRow {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  saved_amount: number;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getGoals(supabase: SupabaseClient, userId: string): Promise<GoalRow[]> {
  try {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order")
      .order("created_at");
    return (data ?? []) as GoalRow[];
  } catch {
    return [];
  }
}

export interface SavingsPoolRow {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export async function getSavingsPool(supabase: SupabaseClient, userId: string): Promise<SavingsPoolRow> {
  try {
    const { data } = await supabase.from("savings_pool").select("*").eq("user_id", userId).maybeSingle();
    if (data) return data as SavingsPoolRow;
  } catch {
    // fall through to empty pool below
  }
  return { id: "", user_id: userId, balance: 0, created_at: "", updated_at: "" };
}

/** Net bakiyeden birikim havuzuna para aktarır — GoalsService.transferToPool ile aynı. */
export async function transferToPool(supabase: SupabaseClient, userId: string, amount: number): Promise<void> {
  const pool = await getSavingsPool(supabase, userId);
  await supabase.from("savings_pool").upsert({
    user_id: userId,
    balance: Number(pool.balance) + amount,
    updated_at: new Date().toISOString(),
  });
  await supabase.from("goal_transactions").insert({
    user_id: userId,
    type: "to_pool",
    amount,
  });
}

/** Birikim havuzundan net bakiyeye geri çeker — GoalsService.transferFromPool ile aynı. */
export async function transferFromPool(supabase: SupabaseClient, userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;
  const pool = await getSavingsPool(supabase, userId);
  if (amount > Number(pool.balance)) {
    throw new Error("Birikim havuzundaki tutarı aşamazsınız");
  }
  await supabase.from("savings_pool").upsert({
    user_id: userId,
    balance: Number(pool.balance) - amount,
    updated_at: new Date().toISOString(),
  });
  await supabase.from("goal_transactions").insert({
    user_id: userId,
    type: "from_pool",
    amount,
  });
}

/** Verilen ay içinde net bakiye ↔ havuz arasında taşınan net tutar
 * (to_pool - from_pool). "Net Bakiye" hesaplamasından düşülür — havuza
 * aktarılan para artık serbestçe harcanabilir bakiyeden sayılmamalı.
 * Mobil GoalsService.getPoolTransferNetForMonth ile aynı mantık. */
export async function getPoolTransferNetForMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number,
): Promise<number> {
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const end = new Date(Date.UTC(year, month, 1)).toISOString();
  const { data } = await supabase
    .from("goal_transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .in("type", ["to_pool", "from_pool"])
    .gte("created_at", start)
    .lt("created_at", end);
  let net = 0;
  for (const row of (data ?? []) as { type: string; amount: number }[]) {
    net += row.type === "to_pool" ? Number(row.amount) : -Number(row.amount);
  }
  return net;
}

/** getPoolTransferNetForMonth'un genel (herhangi bir tarih aralığı) sürümü
 * — Gelirlerim sayfasındaki serbest dönem filtresiyle (hafta/ay/yıl/özel)
 * kullanılmak üzere. `range.start`/`range.end` YYYY-MM-DD, ikisi de dahil;
 * null ise sınırsız (tüm zamanlar) demektir. */
export async function getPoolTransferNetForRange(
  supabase: SupabaseClient,
  userId: string,
  range: { start: string | null; end: string | null },
): Promise<number> {
  let query = supabase
    .from("goal_transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .in("type", ["to_pool", "from_pool"]);
  if (range.start) query = query.gte("created_at", `${range.start}T00:00:00.000Z`);
  if (range.end) {
    const endExclusive = new Date(`${range.end}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    query = query.lt("created_at", endExclusive.toISOString());
  }
  const { data } = await query;
  let net = 0;
  for (const row of (data ?? []) as { type: string; amount: number }[]) {
    net += row.type === "to_pool" ? Number(row.amount) : -Number(row.amount);
  }
  return net;
}

/** Havuzdan belirli bir hedefe para aktarır — atomik `allocate_to_goal` RPC
 * (havuz bakiyesini ve hedef limitini sunucu tarafında doğruluyor). */
export async function allocateToGoal(
  supabase: SupabaseClient,
  userId: string,
  goalId: string,
  amount: number,
): Promise<void> {
  const { error } = await supabase.rpc("allocate_to_goal", {
    p_user_id: userId,
    p_goal_id: goalId,
    p_amount: amount,
  });
  if (error) throw error;
}

/** Silinecek hedefin biriken tutarını havuza iade eder. */
export async function returnSavedAmountToPool(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
): Promise<void> {
  if (amount <= 0) return;
  const pool = await getSavingsPool(supabase, userId);
  await supabase.from("savings_pool").upsert({
    user_id: userId,
    balance: Number(pool.balance) + amount,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteGoal(supabase: SupabaseClient, userId: string, goal: GoalRow): Promise<void> {
  if (Number(goal.saved_amount) > 0) {
    await returnSavedAmountToPool(supabase, userId, Number(goal.saved_amount));
  }
  await supabase.from("goals").delete().eq("id", goal.id).eq("user_id", userId);
}
