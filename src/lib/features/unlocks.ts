import type { SupabaseClient } from "@supabase/supabase-js";

/** Reklam ödülüyle kazanılan, çapraz platform (web + mobil) çalışan özellik
 * hakları. Kazanma (earn) sadece mobilde (AdMob) yapılır; tüketme (consume)
 * hem mobil hem web'den yapılabilir — aynı `feature_unlocks` tablosunu ve
 * RPC'lerini paylaşırlar (bkz. fisle_app supabase/migrations/060_feature_unlocks_time_based.sql).
 * Kazanılan hak TEK KULLANIMLIKTIR ve yalnızca 1 SAAT geçerlidir. */
export type UnlockFeature = "report" | "batch_scan";

/** Kazanılmış-ama-kullanılmamış bir hak varsa (1 saat içinde kazanılmışsa)
 * tüketir ve true döner. Web hiçbir zaman hak "kazanamaz" (reklam SDK'sı
 * yok) — sadece mobilde kazanılmış hakları burada tüketebilir. */
export async function tryConsumeFeatureCredit(
  supabase: SupabaseClient,
  userId: string,
  feature: UnlockFeature,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("try_consume_feature_credit_atomic", {
    p_user_id: userId,
    p_feature: feature,
  });
  if (error) return false;
  return Boolean(data);
}
