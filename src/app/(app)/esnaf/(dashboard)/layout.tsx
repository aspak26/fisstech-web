import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/utils/admin";
import { getActiveBusiness, getUserBusinesses, isBusinessSubscribed } from "@/lib/esnaf/active-business";
import { EsnafSubNav } from "@/components/modules/esnaf/esnaf-sub-nav";
import { BusinessSwitcher } from "@/components/modules/esnaf/business-switcher";
import { RealtimeRefresh } from "@/components/ui/realtime-refresh";
import { UpgradePrompt } from "@/components/modules/shell/upgrade-prompt";
import { EsnafLockedPage } from "@/components/ui/esnaf-locked-page";

/** Esnaf Modu tablo listesi — docs/sql/047_web_realtime.sql çalıştırılmadan
 * bu abonelikler sessizce hiçbir olay almaz (no-op).
 *
 * Optimizasyon denetimi bulgusu: önceden TÜM 44 tablo, hangi sektörde
 * olursa olsun her /esnaf/* sayfasında abone ediliyordu — pano'dayken bile
 * freelance_time_logs/wholesale_order_items gibi tamamen alakasız
 * tablolardaki değişiklikler `router.refresh()` tetikleyip pano'nun tüm
 * server-component ağacını gereksiz yere yeniden çekiyordu. Artık ortak
 * (her sektörde kullanılan) tablolar + sadece aktif işletmenin sektörüne
 * ait tablolar abone ediliyor. */
const COMMON_REALTIME_TABLES = [
  "businesses",
  "business_incomes",
  "business_expenses",
  "business_service_chips",
  "invoices",
  "employees",
  "salary_payments",
  "business_staff",
  "business_invites",
  "staff_commissions",
  "stock_items",
  "stock_movements",
];

const SECTOR_REALTIME_TABLES: Record<string, string[]> = {
  kafe: ["menu_categories", "menu_items", "restaurant_tables", "restaurant_orders", "order_items"],
  perakende: [
    "product_categories",
    "quick_products",
    "perakende_customers",
    "perakende_debts",
    "perakende_transactions",
    "perakende_transaction_items",
  ],
  hizmet: ["hizmet_customers", "service_catalog", "appointments", "service_jobs", "service_job_parts"],
  toptan: ["b2b_customers", "wholesale_orders", "wholesale_order_items", "b2b_transactions", "b2b_payments", "inventory"],
  freelance: [
    "freelance_clients",
    "freelance_projects",
    "project_milestones",
    "project_tasks",
    "freelance_time_logs",
    "project_expenses",
  ],
  satis: ["sale_portfolios", "sale_customers", "sale_transactions", "sale_installments"],
};

export default async function EsnafDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await isAdminUser(supabase, user!.id))) {
    return <EsnafLockedPage />;
  }

  const business = await getActiveBusiness();
  if (!business) {
    redirect("/esnaf");
  }
  const businesses = await getUserBusinesses();

  const subscribed = await isBusinessSubscribed(business.id);
  if (!subscribed) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <BusinessSwitcher businesses={businesses} activeId={business.id} />
        </div>
        <UpgradePrompt
          title="Esnaf Modu bir abonelik gerektirir"
          description={`"${business.name}" işletmesini kullanmaya devam etmek için Esnaf Modu aboneliği gerekiyor. Bu ayrı bir pakettir, kişisel Premium'u kapsamaz.`}
        />
      </div>
    );
  }

  const realtimeTables = [...COMMON_REALTIME_TABLES, ...(SECTOR_REALTIME_TABLES[business.business_type] ?? [])];

  return (
    <div className="mx-auto max-w-5xl">
      <RealtimeRefresh tables={realtimeTables} />
      <div className="mb-4">
        <BusinessSwitcher businesses={businesses} activeId={business.id} />
      </div>
      <EsnafSubNav businessType={business.business_type} />
      {children}
    </div>
  );
}
