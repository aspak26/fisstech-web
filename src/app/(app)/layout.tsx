import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/modules/shell/sidebar";
import { Topbar } from "@/components/modules/shell/topbar";
import { RealtimeRefresh } from "@/components/ui/realtime-refresh";

/** Kişisel modüllerin tablo listesi — docs/sql/047_web_realtime.sql
 * çalıştırılmadan bu abonelikler sessizce hiçbir olay almaz (no-op),
 * asla sahte bir "canlı" görünüm üretmez.
 *
 * Optimizasyon denetimi bulgusu (mobil taraftaki aynı bulgunun web
 * karşılığı): `user_notes` kasıtlı olarak listede DEĞİL. Notlar hiçbir
 * finansal veriyle ilişkili değil ve Dashboard'daki tek tüketicisi
 * (NotesTeaser) sadece not başlıklarını gösteriyor, checklist tamamlanma
 * durumunu değil — ama tabloda olsaydı, bir checklist maddesini her
 * tikleyişte (mobilden bile) bu sayfanın TÜM server-side verisi
 * router.refresh() ile gereksiz yere yeniden çekilirdi. */
const PERSONAL_REALTIME_TABLES = [
  "expenses",
  "expense_items",
  "installment_plans",
  "incomes",
  "fixed_expenses",
  "user_debts",
  "goals",
  "goal_transactions",
  "savings_pool",
  "investments",
  "subscriptions",
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, plan_type")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex h-full min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100] focus-visible:rounded-control focus-visible:bg-accent focus-visible:px-4 focus-visible:py-2 focus-visible:text-on-accent"
      >
        İçeriğe geç
      </a>
      <RealtimeRefresh tables={PERSONAL_REALTIME_TABLES} />
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="print:hidden">
          <Topbar
            name={profile?.name ?? ""}
            email={profile?.email ?? user.email ?? ""}
            planType={profile?.plan_type ?? "free"}
          />
        </div>
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 lg:p-8 print:block print:h-auto print:overflow-visible print:p-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
