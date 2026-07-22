-- Migration 050: get_my_businesses RPC (sahip + Ekip üyesi işletmeler)
--
-- businesses tablosunun RLS SELECT politikası (026_esnaf_modu.sql, mobil
-- migration, hiç güncellenmemiş) SADECE sahibi görebilsin diye
-- `auth.uid() = user_id` — davet kabul edip business_staff'a satırı düşen
-- bir personel bu politika altında o işletmenin businesses satırını
-- OKUYAMAZ. Web'in Ekip (davet kodlu personel) özelliği çalışabilmesi için
-- personelin de kendi işletmelerini görmesi gerekiyor — bu RPC, zaten
-- kurulu get_invite_preview/accept_business_invite deseniyle aynı şekilde
-- (SECURITY DEFINER, dar kapsamlı, sadece gerekli satırları döndürüyor)
-- sahip olunan + business_staff üzerinden aktif (left_at IS NULL) olunan
-- işletmeleri birleştirip döndürür.

CREATE OR REPLACE FUNCTION public.get_my_businesses()
RETURNS SETOF public.businesses
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT b.* FROM public.businesses b WHERE b.user_id = auth.uid()
  UNION
  SELECT b.* FROM public.businesses b
  JOIN public.business_staff bs ON bs.business_id = b.id
  WHERE bs.user_id = auth.uid() AND bs.left_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_my_businesses() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_businesses() TO authenticated;

NOTIFY pgrst, 'reload schema';
