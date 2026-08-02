import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserPlanInfo, isPersonalPremiumOrTrial } from "@/lib/utils/entitlements";

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

export interface AiChatQuota {
  limit: number;
  used: number;
  remaining: number;
}

/** Hak harcamadan kalan kota — sayfa ilk yüklendiğinde göstergeyi (X/50)
 * doldurmak için. */
export async function getAiChatQuotaStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<AiChatQuota> {
  const planInfo = await getUserPlanInfo(supabase, userId);
  const limit = isPersonalPremiumOrTrial(planInfo) ? PREMIUM_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;

  const { data } = await supabase
    .from("ai_chat_usage")
    .select("used_count")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();

  const used = data?.used_count ?? 0;
  return { limit, used, remaining: Math.max(0, limit - used) };
}

/**
 * Mesaj gönderilmeden ÖNCE çağrılır — atomik SQL RPC ile kota tüketir.
 *
 * ÖNEMLİ DÜZELTME: try_consume_ai_chat_credit artık jsonb
 * {allowed, code, limit, used, remaining} döndürüyor (bkz.
 * fisle_app/supabase/migrations/063_ai_chat_quota.sql — mobil ve web AYNI
 * RPC'yi paylaşıyor). Burada önceden `data === true` kontrol ediliyordu; bu
 * karşılaştırma bir nesneyle asla doğru olamayacağı için RPC hatasız her
 * döndüğünde `hasCredit` daima false oluyordu — yani web'de AI sohbet HER
 * mesajda "kota doldu" (402) hatası veriyordu, gerçek kotadan bağımsız
 * olarak. RPC gerçekten hata verirse (örn. henüz deploy edilmemişse)
 * kilitlemek yerine izin veriyoruz (fail-open); bu durumda gerçek limit
 * bilgisi olmadığından `limit: -1` ile işaretleniyor, UI bu durumda sayacı
 * gizler.
 */
export async function consumeAiChatCredit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean } & AiChatQuota> {
  const { data, error } = await supabase.rpc("try_consume_ai_chat_credit", {
    p_user_id: userId,
    p_month: currentMonth(),
    p_free_limit: FREE_MONTHLY_LIMIT,
    p_premium_limit: PREMIUM_MONTHLY_LIMIT,
  });

  if (error || !data) {
    return { allowed: true, limit: -1, used: -1, remaining: -1 };
  }

  const result = data as { allowed: boolean; limit: number; used: number; remaining: number };
  return { allowed: result.allowed, limit: result.limit, used: result.used, remaining: result.remaining };
}
