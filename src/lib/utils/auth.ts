import type { SupabaseClient } from "@supabase/supabase-js";

/** Güvenlik denetimi bulgusu: proje genelinde ~20 dosyada mutasyonlar
 * (update/delete) sadece `.eq("id", id)` ile RLS'e güveniyordu, uygulama
 * tarafında hiçbir sahiplik yeniden-doğrulaması yoktu. Bu yardımcı, her
 * mutasyon fonksiyonunun imzasını değiştirmeden (çağıranlar hâlâ sadece
 * `supabase` + `id` geçiyor) içeride mevcut kullanıcıyı doğrulayıp
 * `.eq("user_id", ...)` ile ikinci bir filtre eklemeyi kolaylaştırır —
 * `esnaf-team.ts`'teki `assertIsBusinessOwner` ile aynı desen. */
export async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");
  return user.id;
}
