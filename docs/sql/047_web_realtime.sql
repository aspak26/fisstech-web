-- ============================================================
-- 047_web_realtime.sql
-- Faz 4: web tarafı için gerçek zamanlı senkronizasyon.
-- Mobil taraf sadece group_messages / expense_groups / kafe-staff
-- (restaurant_tables, restaurant_orders, order_items, menu_items)
-- tablolarını supabase_realtime publication'ına eklemişti — web'in
-- ihtiyaç duyduğu geri kalan tabloları burada ekliyoruz.
--
-- REPLICA IDENTITY FULL GEREKMİYOR: web tarafı payload'daki eski/yeni
-- alan farkını kullanmıyor, sadece "bu tablo değişti" sinyaliyle
-- router.refresh() tetikliyor — varsayılan (primary key) replica
-- identity bu senaryo için yeterli.
--
-- TAM İDEMPOTENT: her tablo publication'a eklenmeden önce kontrol
-- ediliyor, zaten ekli olan (örn. `expenses` — daha önce başka bir
-- yoldan eklenmiş) sessizce atlanıyor. Script'in tamamını defalarca
-- güvenle çalıştırabilirsiniz.
--
-- Supabase Dashboard → SQL Editor'da çalıştırın.
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    -- ── Kişisel modüller ──────────────────────────────────────
    'expenses', 'expense_items', 'installment_plans', 'incomes', 'fixed_expenses',
    'user_debts', 'goals', 'goal_transactions', 'savings_pool', 'investments', 'subscriptions', 'user_notes',

    -- ── Esnaf Modu — ortak altyapı ────────────────────────────
    'businesses', 'business_incomes', 'business_expenses', 'business_service_chips',
    'invoices', 'employees', 'salary_payments', 'stock_items', 'stock_movements', 'menu_categories',

    -- ── Esnaf Modu — Hızlı Perakende ──────────────────────────
    'product_categories', 'quick_products', 'perakende_customers', 'perakende_debts',
    'perakende_transactions', 'perakende_transaction_items',

    -- ── Esnaf Modu — Hizmet & Bakım ───────────────────────────
    'hizmet_customers', 'service_catalog', 'appointments', 'service_jobs', 'service_job_parts',

    -- ── Esnaf Modu — Toptancı & İmalatçı ──────────────────────
    'inventory', 'b2b_customers', 'wholesale_orders', 'wholesale_order_items',
    'b2b_transactions', 'b2b_payments',

    -- ── Esnaf Modu — Serbest Meslek & Proje ───────────────────
    'freelance_clients', 'freelance_projects', 'project_milestones', 'project_tasks',
    'freelance_time_logs', 'project_expenses',

    -- ── Esnaf Modu — Yüksek Hacimli Satış ─────────────────────
    -- sale_documents web'e taşınmadı (mobilde de placeholder) — dahil değil.
    'sale_portfolios', 'sale_customers', 'sale_transactions', 'sale_installments'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
