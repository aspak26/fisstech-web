-- Migration 051: get_business_invite_preview RPC (Ekip davet önizlemesi)
--
-- Gruplarım'daki get_invite_preview (049_group_invite_preview.sql) ile
-- birebir aynı desen: business_invites'ın RLS'i sadece işletme sahibine
-- açık, davet edilen (henüz business_staff'a girmemiş) kullanıcı token'ı
-- okuyamaz. Katılma formunda "hangi işletmeye katılıyorsun" önizlemesi
-- göstermek için SECURITY DEFINER, dar kapsamlı bir RPC ile çözülüyor.

CREATE OR REPLACE FUNCTION public.get_business_invite_preview(p_token text)
RETURNS TABLE(business_id uuid, business_name text, role text, status text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT b.id, b.name, bi.role, bi.status, bi.expires_at
  FROM public.business_invites bi
  JOIN public.businesses b ON b.id = bi.business_id
  WHERE bi.token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_business_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_invite_preview(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
