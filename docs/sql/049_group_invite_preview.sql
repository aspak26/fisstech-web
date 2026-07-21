-- Migration 049: get_invite_preview RPC (Gruplarım davet önizlemesi)
--
-- Mobil taraf davet önizlemesini (join_group_screen.dart) group_invites'a
-- doğrudan bir client-side SELECT ile okuyor. Web'in bunu güvenle
-- kopyalayabilmesi için group_invites üzerindeki RLS politikalarının
-- gerçekten davet edilen (grup sahibi OLMAYAN) bir kullanıcının o daveti
-- okumasına izin verip vermediği canlı veritabanında doğrulanamadı — iki
-- ayrı, birbirinden bağımsız geliştirilmiş migration geçmişi (bkz.
-- PROGRESS.md Kararlar Günlüğü) birbiriyle çelişen politikalar tanımlıyor.
--
-- Bu belirsizliği YENİ bir client-side sorgu yazıp riske girmek yerine,
-- zaten var olan `accept_group_invite` RPC'siyle AYNI desende
-- (SECURITY DEFINER, RLS'i bilinçli ve güvenli şekilde atlıyor, sadece
-- gerekli 4 alanı döndürüyor) bir önizleme fonksiyonu ile çözüyoruz.

CREATE OR REPLACE FUNCTION public.get_invite_preview(p_token text)
RETURNS TABLE(group_id uuid, group_name text, status text, expires_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT g.id, g.name, gi.status, gi.expires_at
  FROM public.group_invites gi
  JOIN public.groups g ON g.id = gi.group_id
  WHERE gi.token = p_token;
$$;

REVOKE ALL ON FUNCTION public.get_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
