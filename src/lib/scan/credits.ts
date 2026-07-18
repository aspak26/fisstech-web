import type { SupabaseClient } from "@supabase/supabase-js";

/** Mirrors ScanService.freeMonthlyLimit in fisle_app scan_service.dart. */
export const FREE_MONTHLY_LIMIT = 20;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function isPremium(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();
  return data?.plan === "premium";
}

export async function getRemainingScanCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  if (await isPremium(supabase, userId)) return 9999;

  const { data } = await supabase
    .from("receipt_credits")
    .select("used_count, earned_count")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();

  if (!data) return FREE_MONTHLY_LIMIT;
  const remaining = FREE_MONTHLY_LIMIT + data.earned_count - data.used_count;
  return Math.min(999, Math.max(0, remaining));
}

/** Returns false if the monthly quota is exhausted (premium always succeeds). */
export async function consumeScanCredit(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (await isPremium(supabase, userId)) return true;

  const { data, error } = await supabase.rpc("try_consume_scan_credit", {
    p_user_id: userId,
    p_month: currentMonth(),
    p_limit: FREE_MONTHLY_LIMIT,
  });

  if (error) return false;
  return data === true;
}

/** Called when a scan is cancelled after consuming a credit — gives it back. */
export async function refundScanCredit(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  if (await isPremium(supabase, userId)) return;

  const { data } = await supabase
    .from("receipt_credits")
    .select("id, used_count")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();

  if (!data || data.used_count <= 0) return;

  await supabase
    .from("receipt_credits")
    .update({ used_count: data.used_count - 1 })
    .eq("id", data.id);
}
