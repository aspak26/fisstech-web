-- Migration 052: Raporlar sayfası için DB-tarafı GROUP BY RPC'leri
-- (HAZIRLANDI ama web koduna BAĞLANMADI — bkz. aşağıdaki gerekçe)
--
-- Optimizasyon denetimi bulgusu: getEsnafPeriodData tüm business_incomes/
-- business_expenses satırlarını çekip kategori/gelir-kalemi toplamlarını
-- JS'te hesaplıyor. Bu iki RPC aynı toplamları Postgres'te (GROUP BY ile)
-- hesaplayıp SADECE aggregate satırları döndürür.
--
-- BİLİNÇLİ OLARAK web koduna bağlanmadı: getEsnafRaporlarBundle() zaten
-- 6 aylık trend için TÜM ham satırları TEK sorguda çekiyor (bkz.
-- getEsnafPeriodData, 22 Temmuz'daki dedup turu) — kategori/gelir-kalemi
-- kırılımı bu ZATEN ELDEKİ satırlardan sıfır ek round-trip ile
-- hesaplanıyor. Bu RPC'leri çağırmak (yerine kullanmak değil, EK olarak)
-- her sayfa yüklemesinde 2 FAZLA round-trip eklerdi — tipik bir esnaf
-- işletmesi (ayda onlarca-yüzlerce işlem) için bu net bir KAYIP olurdu,
-- kazanç sadece ayda binlerce işlemi olan uç bir işletmede görülür.
-- Optimizasyon.md'nin "yüksek ROI'yi tercih et, gerekçesiz mikro-
-- optimizasyon önerme" kuralı gereği şu an aktif edilmedi.
--
-- Gerçekten çok yüksek hacimli bir işletme bu darboğaza girerse: bu
-- fonksiyonlar zaten hazır, tek yapılması gereken getEsnafPeriodData'nın
-- ham satır çekimini BU İKİ RPC + üçüncü bir "aylık toplam" RPC'siyle
-- TAMAMEN değiştirmek (kısmi bağlama round-trip sayısını artırıp veri
-- hacmini azaltmaz, ikisini birden iyileştirmek için tam geçiş gerekir).

CREATE OR REPLACE FUNCTION public.get_esnaf_category_totals(p_business_id uuid, p_start date, p_end date)
RETURNS TABLE(category text, total numeric)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT be.category, sum(be.amount) AS total
  FROM public.business_expenses be
  JOIN public.businesses b ON b.id = be.business_id
  WHERE be.business_id = p_business_id
    AND b.user_id = auth.uid()
    AND be.expense_date >= p_start
    AND be.expense_date <= p_end
  GROUP BY be.category
  ORDER BY total DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_esnaf_income_item_totals(p_business_id uuid, p_start date, p_end date)
RETURNS TABLE(label text, transaction_date date, total numeric)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT
    NULLIF(TRIM(COALESCE(NULLIF(bi.chip_label, ''), NULLIF(bi.description, ''), 'Diğer')), '') AS label,
    bi.transaction_date,
    sum(bi.amount) AS total
  FROM public.business_incomes bi
  JOIN public.businesses b ON b.id = bi.business_id
  WHERE bi.business_id = p_business_id
    AND b.user_id = auth.uid()
    AND bi.transaction_date >= p_start
    AND bi.transaction_date <= p_end
  GROUP BY label, bi.transaction_date;
$$;

REVOKE ALL ON FUNCTION public.get_esnaf_category_totals(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_esnaf_income_item_totals(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_esnaf_category_totals(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_esnaf_income_item_totals(uuid, date, date) TO authenticated;

NOTIFY pgrst, 'reload schema';
