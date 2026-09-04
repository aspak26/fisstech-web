"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** 7 günlük ücretsiz deneme başlatır — fisle_app'teki
 * UserProfileService.startTrial() ile aynı amaç, ama doğrudan `update`
 * yerine `start_trial` RPC'sini çağırıyor (bkz. docs/sql/056_protect_trial_and_related_columns.sql).
 * Güvenlik denetimi bulgusu (Critical): `trial_started_at` önceden
 * `protect_user_plan_columns` trigger'ının koruduğu sütun listesinde
 * DEĞİLDİ — herhangi bir kullanıcı bu kolonu tarayıcı konsolundan
 * doğrudan `update` ile periyodik olarak "şimdi"ye sıfırlayıp süresiz
 * ücretsiz premium elde edebiliyordu. RPC hem trigger'ı (artık bu kolonu
 * da koruyor) SECURITY DEFINER içinden meşru şekilde bypass ediyor hem de
 * uygunluk kontrolünü (deneme hiç başlamamış + zaten abone değil) veritabanı
 * tarafında tekrar doğruluyor — client'ın gönderdiği hiçbir veriye güvenmiyor. */
export async function startTrialAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const { error } = await supabase.rpc("start_trial", { p_user_id: user.id });

  if (error) return { success: false, error: "Deneme başlatılamadı, lütfen tekrar dene." };

  revalidatePath("/", "layout");
  return { success: true };
}

/** Deneme teklifini kapatıp bir daha otomatik gösterilmemesini sağlar —
 * fisle_app'teki UserProfileService.dismissTrialOffer() ile aynı. */
export async function dismissTrialOfferAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("users").update({ trial_offer_dismissed: true }).eq("id", user.id);
  revalidatePath("/", "layout");
}
