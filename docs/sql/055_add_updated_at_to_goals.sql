-- ═══════════════════════════════════════════════════════════════════════════
-- 055 Add updated_at to goals table
--
-- Sorun: allocate_to_goal RPC'si veya diğer işlemler goals tablosunda
-- "updated_at" sütununu güncellemeye çalışıyor, ancak tabloda bu sütun yok.
-- Bu nedenle "column 'updated_at' of relation 'goals' does not exist" hatası alınıyor.
--
-- Çözüm: goals tablosuna updated_at sütunu eklenir.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Eğer bir trigger eklemek isterseniz, opsiyonel olarak şu da eklenebilir:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--    NEW.updated_at = NOW();
--    RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
-- CREATE TRIGGER update_goals_updated_at
-- BEFORE UPDATE ON public.goals
-- FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema cache yenile
NOTIFY pgrst, 'reload schema';
