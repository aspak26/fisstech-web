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
-- Supabase Dashboard → SQL Editor'da çalıştırın (idempotent — ADD TABLE
-- IF NOT EXISTS deseni yok ama zaten ekli bir tabloyu tekrar eklemeye
-- çalışmak hataya sebep olur; komutları paylı çalıştırıyorsanız 'already
-- member of publication' hatası alırsanız o satırı atlayabilirsiniz).
-- ============================================================

-- ── Kişisel modüller ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.installment_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fixed_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notes;

-- ── Esnaf Modu — ortak altyapı ───────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_service_chips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salary_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_categories;
-- menu_items zaten mobil migration 040'ta eklenmişti — burada tekrar
-- eklemeye çalışmayın, "already member of publication" hatası verir.

-- ── Esnaf Modu — Hızlı Perakende ─────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perakende_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perakende_debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perakende_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.perakende_transaction_items;

-- ── Esnaf Modu — Hizmet & Bakım ──────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.hizmet_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_catalog;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_job_parts;

NOTIFY pgrst, 'reload schema';
