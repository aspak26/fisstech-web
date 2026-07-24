-- Migration 053: Web-side abonelik (paywall) uygulaması
--
-- Şu ana kadar web'de (ve mobilde) tarama kredisi dışında HİÇBİR özellik
-- gerçekten aboneliğe göre kilitlenmiyordu — Esnaf Modu, esnaf personel
-- limiti, AI sohbet "aylık 50 mesaj" (3 ayrı pazarlama metninde vaat
-- ediliyor ama kodda hiç yok), grup oluşturma limiti hepsi tamamen açıktı.
-- Bu migration bunun için gereken sunucu-taraflı (RLS'yi atlayamayan)
-- kontrolleri ekliyor. Web tarafındaki kod bu fonksiyonlar/HENÜZ
-- production'da yokken (bu SQL çalıştırılmadan) hata almak yerine
-- "açık" (fail-open) davranacak şekilde yazıldı — 050_my_businesses.sql'de
-- yaşanan "SQL çalıştırılmadan önce herkesin erişimi kayboldu" regresyonu
-- tekrarlamamak için bilinçli bir tercih.

-- ─── AI sohbet aylık kullanım sayacı (receipt_credits ile aynı desen) ────

CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  used_count  integer NOT NULL DEFAULT 0,
  month       text NOT NULL, -- format: 'YYYY-MM'
  UNIQUE (user_id, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_usage TO authenticated, service_role;
ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_chat_usage_select" ON public.ai_chat_usage;
DROP POLICY IF EXISTS "ai_chat_usage_insert" ON public.ai_chat_usage;
DROP POLICY IF EXISTS "ai_chat_usage_update" ON public.ai_chat_usage;
DROP POLICY IF EXISTS "ai_chat_usage_delete" ON public.ai_chat_usage;

CREATE POLICY "ai_chat_usage_select" ON public.ai_chat_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ai_chat_usage_insert" ON public.ai_chat_usage FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_chat_usage_update" ON public.ai_chat_usage FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ai_chat_usage_delete" ON public.ai_chat_usage FOR DELETE USING (user_id = auth.uid());

-- Atomik "kredi tüket" — try_consume_scan_credit (039_security_hardening.sql)
-- ile aynı FOR UPDATE kilitleme deseni. Limit sayıları çağıran taraftan
-- (web) geliyor ama plan_type DB'den okunuyor — client hangi limiti
-- göndereceğine karar veremiyor, sadece hangi ÇİFTİN (free/premium)
-- kullanılacağını server plan_type'a bakarak kendi belirliyor.
CREATE OR REPLACE FUNCTION public.try_consume_ai_chat_credit(
  p_user_id uuid,
  p_month text,
  p_free_limit int DEFAULT 5,
  p_premium_limit int DEFAULT 50
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan_type text;
  v_limit     int;
  v_used      int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz' USING ERRCODE = '42501';
  END IF;

  SELECT plan_type INTO v_plan_type FROM public.users WHERE id = p_user_id;
  v_limit := CASE WHEN v_plan_type IN ('premium', 'family') THEN p_premium_limit ELSE p_free_limit END;

  INSERT INTO public.ai_chat_usage (user_id, month, used_count)
  VALUES (p_user_id, p_month, 0)
  ON CONFLICT (user_id, month) DO NOTHING;

  SELECT used_count INTO v_used
  FROM public.ai_chat_usage
  WHERE user_id = p_user_id AND month = p_month
  FOR UPDATE;

  IF v_used >= v_limit THEN
    RETURN false;
  END IF;

  UPDATE public.ai_chat_usage SET used_count = used_count + 1
  WHERE user_id = p_user_id AND month = p_month;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_ai_chat_credit(uuid, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_consume_ai_chat_credit(uuid, text, int, int) TO authenticated;

-- ─── Esnaf Modu erişimi: işletme SAHİBİNİN aboneliğini kontrol et ────────
--
-- Personel (business_staff), kendi esnaf_plan'ı olmadan da işveren
-- aboneliği üzerinden erişebilmeli — bu yüzden "auth.uid()'nin kendi
-- planı" değil, "işletme sahibinin planı" okunuyor. RLS'nin businesses/
-- users tablolarındaki kısıtlarını atlamak için SECURITY DEFINER, ama
-- sadece o işletmenin sahibi veya aktif personeli çağırabiliyor.
CREATE OR REPLACE FUNCTION public.get_business_owner_plan(p_business_id uuid)
RETURNS TABLE(esnaf_plan text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT u.esnaf_plan
  FROM public.businesses b
  JOIN public.users u ON u.id = b.user_id
  WHERE b.id = p_business_id
    AND (
      b.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.business_staff bs
        WHERE bs.business_id = b.id AND bs.user_id = auth.uid() AND bs.left_at IS NULL
      )
    );
$$;

REVOKE ALL ON FUNCTION public.get_business_owner_plan(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_business_owner_plan(uuid) TO authenticated;

-- ─── Esnaf personel limiti artık sunucu tarafında da uygulanıyor ─────────
--
-- Önceden esnaf_staff_limit SADECE web UI'sında ("Davet Kodu Oluştur"
-- butonu disable) kontrol ediliyordu — accept_business_invite RPC'sinin
-- kendisi hiç bakmıyordu, yani API doğrudan çağrılarak limit bypass
-- edilebiliyordu. Fonksiyonun geri kalanı 039_security_hardening.sql'deki
-- ile birebir aynı, sadece INSERT'ten hemen önce bir kota kontrolü eklendi.
--
-- Not: production'daki mevcut fonksiyonun dönüş tipi migration
-- dosyalarındakinden farklı çıktı (42P13 hatası) — CREATE OR REPLACE bunu
-- değiştiremiyor, önce DROP gerekiyor. Bu tek fonksiyonun kısa bir an için
-- yok olması (aynı SQL Editor çalıştırmasında hemen ardından yeniden
-- oluşturuluyor) düşük trafikli bu RPC için güvenli kabul edildi.
DROP FUNCTION IF EXISTS public.accept_business_invite(text);
CREATE OR REPLACE FUNCTION public.accept_business_invite(p_token text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invite      business_invites%ROWTYPE;
  v_business    businesses%ROWTYPE;
  v_staff_limit int;
  v_active_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Giriş gerekli' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_invite FROM business_invites
    WHERE token = trim(p_token)
      AND status = 'pending'
      AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Davet bulunamadı veya süresi dolmuş';
  END IF;

  SELECT * INTO v_business FROM businesses WHERE id = v_invite.business_id;

  IF EXISTS (
    SELECT 1 FROM business_staff
     WHERE business_id = v_invite.business_id
       AND user_id = auth.uid()
       AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Bu işyerinde zaten çalışmaktasınız';
  END IF;

  SELECT esnaf_staff_limit INTO v_staff_limit FROM users WHERE id = v_business.user_id;
  SELECT count(*) INTO v_active_count FROM business_staff
    WHERE business_id = v_invite.business_id AND left_at IS NULL;

  IF v_active_count >= COALESCE(v_staff_limit, 0) THEN
    RAISE EXCEPTION 'İşletme personel kotası doldu';
  END IF;

  INSERT INTO business_staff (business_id, user_id, role, invited_by)
    VALUES (v_invite.business_id, auth.uid(), v_invite.role, v_invite.created_by);

  UPDATE business_invites SET status = 'accepted' WHERE id = v_invite.id;

  RETURN json_build_object(
    'business_id',   v_business.id,
    'business_name', v_business.name,
    'role',          v_invite.role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_business_invite(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
