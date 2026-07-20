import type { SupabaseClient } from "@supabase/supabase-js";

/** Ported from mobile's BusinessService.uploadLogo — public `business_logos`
 * bucket, path scoped to `{userId}/{businessId}/...` (matches the storage
 * RLS policy, which checks the first path segment against auth.uid()). */
export async function uploadBusinessLogo(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${businessId}/logo_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("business_logos").upload(path, file);
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("business_logos").getPublicUrl(path);
  const url = data.publicUrl;

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ logo_url: url })
    .eq("id", businessId);
  if (updateError) throw updateError;

  return url;
}
