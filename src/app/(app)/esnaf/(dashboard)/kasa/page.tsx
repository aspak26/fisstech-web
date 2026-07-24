import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import {
  getBusinessIncomes,
  getBusinessExpenses,
  getServiceChips,
  getDailyTotals,
} from "@/lib/data/esnaf";
import { DailyTotalsCard } from "@/components/modules/esnaf/daily-totals-card";
import { KasaList } from "@/components/modules/esnaf/kasa-list";

export default async function EsnafKasaPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = searchParams.date || today;
  
  const [incomes, expenses, chips, dailyTotals] = await Promise.all([
    getBusinessIncomes(supabase, business.id),
    getBusinessExpenses(supabase, business.id),
    getServiceChips(supabase, business.id),
    getDailyTotals(supabase, business.id, selectedDate),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Kasa Defteri</h1>
      <DailyTotalsCard totals={dailyTotals} selectedDate={selectedDate} />
      <KasaList business={business} incomes={incomes} expenses={expenses} chips={chips} />
    </div>
  );
}
