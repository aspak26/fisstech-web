-- Migration 056: trial_started_at (ve ilgili plan-bitişik kolonlar)
-- protect_user_plan_columns() trigger'ının koruma listesine ekleniyor.
--
-- GÜVENLİK BULGUSU (Critical, bkz. SECURITY_AUDIT_WEB.md Round 2 Bulgu #6):
-- users tablosundaki "users_own" RLS politikası (003_rls_policies.sql,
-- FOR ALL USING (auth.uid() = id)) her kimlik doğrulamalı kullanıcının
-- kendi satırını HERHANGİ bir sütun için doğrudan UPDATE etmesine izin
-- veriyor — bunu kısıtlayan tek şey protect_user_plan_columns() trigger'ı
-- (048_fix_admin_and_group_join.sql). Web'e 7 günlük ücretsiz deneme
-- özelliği eklendiğinde (users.trial_started_at, 061_trial_start.sql) bu
-- trigger'ın koruduğu sütun listesi GÜNCELLENMEDİ — yani herhangi bir
-- kullanıcı tarayıcı konsolundan:
--   supabase.from('users').update({ trial_started_at: new Date().toISOString() }).eq('id', kendi_id)
-- çağırarak deneme süresini periyodik olarak "şimdi"ye sıfırlayıp SÜRESİZ
-- ücretsiz premium elde edebiliyordu. Aynı paylaşımlı veritabanı yüzünden
-- bu mobil uygulamayı da etkiliyordu.
--
-- Bu migration:
--   1) trial_started_at + aynı sınıftan üç sütunu (esnaf_staff_limit,
--      has_claimed_early_gift, is_early_tester — hiçbiri client tarafından
--      meşru olarak doğrudan yazılmıyor, hepsi ya RevenueCat webhook'u
--      [service_role, trigger'dan zaten muaf] ya da SECURITY DEFINER
--      RPC'ler tarafından yazılıyor) koruma listesine ekliyor.
--   2) Web'in startTrialAction()'ının (src/lib/actions/trial.ts) artık
--      trigger tarafından bloklanan doğrudan UPDATE'i yerine kullanacağı
--      yeni bir start_trial(p_user_id) RPC'si ekliyor — 084_fix_early_gift.sql'deki
--      claim_early_gift() ile AYNI desen (request.jwt.claims'i geçici
--      olarak temizleyip trigger'ı SECURITY DEFINER içinden bypass etmek).
--      Uygunluk kontrolü, web'in kendi canStartTrial mantığıyla birebir
--      aynı: deneme hiç başlamamış VE kullanıcı zaten premium/esnaf değil.

-- ─── 1. Trigger'ın koruduğu sütun listesini genişlet ─────────────────────

CREATE OR REPLACE FUNCTION public.protect_user_plan_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- service_role bağlantısında auth.uid() NULL döner → geç (webhook/admin işlemleri çalışsın)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_type IS DISTINCT FROM OLD.plan_type
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.esnaf_plan IS DISTINCT FROM OLD.esnaf_plan
     OR NEW.subscription_end_date IS DISTINCT FROM OLD.subscription_end_date
     OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at
     OR NEW.esnaf_staff_limit IS DISTINCT FROM OLD.esnaf_staff_limit
     OR NEW.has_claimed_early_gift IS DISTINCT FROM OLD.has_claimed_early_gift
     OR NEW.is_early_tester IS DISTINCT FROM OLD.is_early_tester
  THEN
    RAISE EXCEPTION 'Bu alanlar değiştirilemez' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- ─── 2. start_trial RPC — startTrialAction()'ın yeni, korumayı bypass eden yolu ──

DROP FUNCTION IF EXISTS public.start_trial(uuid);

CREATE OR REPLACE FUNCTION public.start_trial(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original_claims text;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Yetkisiz islem';
  END IF;

  -- Web'deki canStartTrial mantığıyla birebir aynı uygunluk kontrolü
  -- (entitlements.ts): deneme hiç başlamamış VE kullanıcı zaten
  -- kişisel premium/aile değil VE esnaf abonesi değil.
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id
      AND trial_started_at IS NULL
      AND plan_type NOT IN ('premium', 'family')
      AND esnaf_plan IS DISTINCT FROM 'esnaf_premium'
  ) THEN
    RAISE EXCEPTION 'Deneme başlatılamaz (zaten kullanılmış veya aktif bir aboneliğiniz var)';
  END IF;

  -- protect_user_plan_columns trigger'ını geçici olarak bypass et (aynen
  -- claim_early_gift'teki desen) — trigger auth.uid() IS NULL olduğunda geçiyor.
  v_original_claims := current_setting('request.jwt.claims', true);
  PERFORM set_config('request.jwt.claims', '', true);

  UPDATE public.users SET trial_started_at = now() WHERE id = p_user_id;

  PERFORM set_config('request.jwt.claims', v_original_claims, true);
END;
$$;

REVOKE ALL ON FUNCTION public.start_trial(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_trial(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
