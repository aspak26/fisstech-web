import type { SupabaseClient } from "@supabase/supabase-js";

/** Geliştirici/test hesapları — mobil taraftaki `is_admin` kolonuyla aynı,
 * paylaşılan `users` tablosundan okunur (bkz. fisle_app EsnafAccessGuard). */
export async function isAdminUser(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("users").select("is_admin").eq("id", userId).maybeSingle();
  return Boolean(data?.is_admin);
}
