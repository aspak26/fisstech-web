import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserPlanInfo, isPersonalPremium } from "@/lib/utils/entitlements";

/** Pazarlama metninde vaat edilen "aylık 50 AI sohbet hakkı" (Premium) —
 * bkz. ai-chat/route.ts sistem promptu ve landing fiyatlandırma kartları.
 * Free için ayrı bir sayı hiçbir dokümanda belirtilmemişti, ürün kararı
 * gerektirir — tanıtım amaçlı, kolayca ayarlanabilir bir varsayılan olarak
 * 5/ay seçildi (bkz. docs/PROGRESS.md). */
export const FREE_MONTHLY_LIMIT = 5;
export const PREMIUM_MONTHLY_LIMIT = 50;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getRemainingAiChatCredits(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { planType } = await getUserPlanInfo(supabase, userId);
  const limit = isPersonalPremium(planType) ? PREMIUM_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  const { data } = await supabase
    .from("ai_chat_usage")
    .select("used_count")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();

  return Math.max(0, limit - (data?.used_count ?? 0));
}

/** docs/sql/053_paywall_enforcement.sql çalıştırılmadan RPC production'da
 * yok — bu durumda sohbeti kilitlemek yerine izin veriyoruz (fail-open),
 * eksik bir migration yüzünden çalışan bir özelliği kırmamak için. SQL
 * çalıştırılınca kota otomatik devreye girer. */
export async function consumeAiChatCredit(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("try_consume_ai_chat_credit", {
    p_user_id: userId,
    p_month: currentMonth(),
    p_free_limit: FREE_MONTHLY_LIMIT,
    p_premium_limit: PREMIUM_MONTHLY_LIMIT,
  });

  if (error) return true;
  return data === true;
}
