-- ═══════════════════════════════════════════════════════════════════════════
-- 054 Fix allocate_to_goal (idempotent, SQL Editor'da güvenle çalışır)
--
-- Sorun: allocate_to_goal fonksiyonu savings_pool tablosundan 'id' sütununu 
-- seçmeye çalışıyordu, ancak eski veritabanı şemasında (20260621_goals.sql) 
-- savings_pool tablosunda 'id' sütunu yok (user_id primary key).
-- 022 numaralı migration IF NOT EXISTS kullandığı için bu sütun sonradan 
-- eklenmemişti, bu da "column 'id' does not exist" hatasına yol açıyordu.
--
-- Çözüm: savings_pool tablosu için id yerine sadece user_id kullanılarak
-- FOR UPDATE ve UPDATE işlemleri yapıldı.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.allocate_to_goal(
  p_user_id uuid,
  p_goal_id uuid,
  p_amount  numeric
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_balance   numeric;
  v_saved     numeric;
  v_target    numeric;
BEGIN
  -- Yalnızca kendi hedefini değiştirebilir
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Yetkisiz işlem' USING ERRCODE = '42501';
  END IF;

  -- savings_pool'dan sadece balance seçiyoruz, id sütunu eski şemalarda olmayabilir
  SELECT balance INTO v_balance
    FROM public.savings_pool
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Birikim havuzu bulunamadı' USING ERRCODE = 'P0002';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Yetersiz bakiye' USING ERRCODE = 'P0001';
  END IF;

  SELECT saved_amount, target_amount INTO v_saved, v_target
    FROM public.goals
   WHERE id = p_goal_id AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hedef bulunamadı' USING ERRCODE = 'P0002';
  END IF;

  -- savings_pool'u güncellerken user_id kullanıyoruz
  UPDATE public.savings_pool
     SET balance    = v_balance - p_amount,
         updated_at = now()
   WHERE user_id = p_user_id;

  -- goals tablosunu güncelliyoruz
  UPDATE public.goals
     SET saved_amount = LEAST(v_saved + p_amount, v_target),
         completed_at = CASE WHEN v_saved + p_amount >= v_target THEN now() ELSE NULL END,
         updated_at   = now()
   WHERE id = p_goal_id;

  INSERT INTO public.goal_transactions (user_id, goal_id, type, amount)
  VALUES (p_user_id, p_goal_id, 'to_goal', p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_to_goal(uuid, uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_to_goal(uuid, uuid, numeric) TO authenticated;

-- ─── Schema cache yenile ──────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
