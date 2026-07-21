import { redirect } from "next/navigation";
import { getActiveBusiness, getUserBusinesses } from "@/lib/esnaf/active-business";
import { EsnafSubNav } from "@/components/modules/esnaf/esnaf-sub-nav";
import { BusinessSwitcher } from "@/components/modules/esnaf/business-switcher";
import { RealtimeRefresh } from "@/components/ui/realtime-refresh";

/** Esnaf Modu tablo listesi — docs/sql/047_web_realtime.sql çalıştırılmadan
 * bu abonelikler sessizce hiçbir olay almaz (no-op). */
const ESNAF_REALTIME_TABLES = [
  "businesses",
  "business_incomes",
  "business_expenses",
  "business_service_chips",
  "invoices",
  "employees",
  "salary_payments",
  "staff_commissions",
  "stock_items",
  "stock_movements",
  "menu_categories",
  "menu_items",
  "restaurant_tables",
  "restaurant_orders",
  "order_items",
  "product_categories",
  "quick_products",
  "perakende_customers",
  "perakende_debts",
  "perakende_transactions",
  "perakende_transaction_items",
  "hizmet_customers",
  "service_catalog",
  "appointments",
  "service_jobs",
  "service_job_parts",
  "inventory",
  "b2b_customers",
  "wholesale_orders",
  "wholesale_order_items",
  "b2b_transactions",
  "b2b_payments",
  "freelance_clients",
  "freelance_projects",
  "project_milestones",
  "project_tasks",
  "freelance_time_logs",
  "project_expenses",
  "sale_portfolios",
  "sale_customers",
  "sale_transactions",
  "sale_installments",
];

export default async function EsnafDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await getActiveBusiness();
  if (!business) {
    redirect("/esnaf");
  }
  const businesses = await getUserBusinesses();

  return (
    <div className="mx-auto max-w-5xl">
      <RealtimeRefresh tables={ESNAF_REALTIME_TABLES} />
      <div className="mb-4">
        <BusinessSwitcher businesses={businesses} activeId={business.id} />
      </div>
      <EsnafSubNav businessType={business.business_type} />
      {children}
    </div>
  );
}
