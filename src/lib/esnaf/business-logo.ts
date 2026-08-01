import type { SupabaseClient } from "@supabase/supabase-js";
import { detectImageType } from "@/lib/utils/file-validation";

/** Ported from mobile's BusinessService.uploadLogo — public `business_logos`
 * bucket, path scoped to `{userId}/{businessId}/...` (matches the storage
 * RLS policy, which checks the first path segment against auth.uid()).
 * File type is verified via magic bytes (not the client-supplied name/type)
 * before upload — this bucket is PUBLIC, so an unvalidated upload (e.g. an
 * SVG with an embedded script served back as image/svg+xml) would be
 * reachable by anyone with the URL, no auth required. */
export async function uploadBusinessLogo(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
  file: File,
): Promise<string> {
  const detected = await detectImageType(file);
  if (!detected) throw new Error("Sadece JPEG, PNG veya WebP formatında görsel yükleyebilirsiniz.");
  const path = `${userId}/${businessId}/logo_${Date.now()}.${detected.ext}`;

  const { error: uploadError } = await supabase.storage
    .from("business_logos")
    .upload(path, file, { contentType: detected.mime });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("business_logos").getPublicUrl(path);
  const url = data.publicUrl;

  // Güvenlik denetimi bulgusu: RLS'e ek defense-in-depth — sahibi olmayan
  // bir businessId verilse bile bu satır sessizce 0 satır etkiler.
  const { error: updateError } = await supabase
    .from("businesses")
    .update({ logo_url: url })
    .eq("id", businessId)
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return url;
}

export async function removeBusinessLogo(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<void> {
  const { error } = await supabase
    .from("businesses")
    .update({ logo_url: null })
    .eq("id", businessId)
    .eq("user_id", userId);
  if (error) throw error;
}
