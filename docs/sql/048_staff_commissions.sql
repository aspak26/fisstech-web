-- Migration 048: staff_commissions tablosu (Hizmet & Bakım usta primleri)
--
-- Mobil kaynakta (`staff_commission_service.dart`) bu tabloya referans var
-- ama fisleapp/supabase/migrations klasöründe bu tabloyu oluşturan bir
-- migration YOK — muhtemelen Supabase Dashboard'dan elle oluşturulmuş.
-- Web tarafında bu tabloyu kullanan (Atölye "İşi Tamamla" akışına usta
-- prim hesabı ekleyen) bir özellik inşa edildiğinde production'da bu
-- tablonun GERÇEKTEN var olduğu doğrulanamadı — bu yüzden CREATE TABLE
-- IF NOT EXISTS ile güvenli şekilde (zaten varsa hiçbir şeyi bozmadan)
-- garanti altına alınıyor. Kolonlar mobil kaynaktaki insert/select
-- çağrılarından birebir çıkarıldı: business_id, user_id, staff_id, job_id,
-- amount, commission_rate, period_month.

CREATE TABLE IF NOT EXISTS public.staff_commissions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  staff_id         uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  job_id           uuid REFERENCES public.service_jobs(id) ON DELETE SET NULL,
  amount           numeric NOT NULL CHECK (amount >= 0),
  commission_rate  numeric NOT NULL CHECK (commission_rate >= 0),
  period_month     date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_commissions TO authenticated, service_role;
ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_commissions_select" ON public.staff_commissions;
DROP POLICY IF EXISTS "staff_commissions_insert" ON public.staff_commissions;
DROP POLICY IF EXISTS "staff_commissions_update" ON public.staff_commissions;
DROP POLICY IF EXISTS "staff_commissions_delete" ON public.staff_commissions;

CREATE POLICY "staff_commissions_select" ON public.staff_commissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "staff_commissions_insert" ON public.staff_commissions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff_commissions_update" ON public.staff_commissions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "staff_commissions_delete" ON public.staff_commissions FOR DELETE USING (user_id = auth.uid());

-- Realtime publication'a ekle (047_web_realtime.sql'in idempotent deseniyle aynı).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'staff_commissions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_commissions';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
