"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** 7 günlük ücretsiz deneme başlatır — fisle_app'teki
 * UserProfileService.startTrial() ile birebir aynı: sadece `users.trial_started_at`
 * kolonuna şu anki zamanı yazar. Paylaşılan backend sayesinde mobilde
 * başlatılan bir deneme web'de, web'de başlatılan bir deneme mobilde aynı
 * anda geçerli olur — ayrı bir senkronizasyon mekanizması gerekmez. */
export async function startTrialAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Oturum bulunamadı." };

  const { error } = await supabase
    .from("users")
    .update({ trial_started_at: new Date().toISOString() })
    .eq("id", user.id);

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
