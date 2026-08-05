import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getArchivedExpenses } from "@/lib/data/expenses";
import { getUserPlanInfo, isPersonalPremiumOrTrial } from "@/lib/utils/entitlements";
import { calculatePeriodRange, DEFAULT_EXPENSE_PERIOD } from "@/lib/utils/period";
import { PeriodSelector } from "@/components/ui/period-selector";
import { ExpensesArchiveGrid } from "@/components/modules/expenses/expenses-archive-grid";

export default async function ExpensesArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const planInfo = await getUserPlanInfo(supabase, userId);
  
  if (!isPersonalPremiumOrTrial(planInfo)) {
    redirect("/#pricing");
  }

  const { period: periodParam } = await searchParams;
  const period = periodParam ?? DEFAULT_EXPENSE_PERIOD;
  const { start, end } = calculatePeriodRange(period);

  const expenses = await getArchivedExpenses(supabase, userId, { start, end });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Fiş Arşivi</h1>
        <Suspense fallback={<div className="h-10 w-32" />}>
          <PeriodSelector period={period} />
        </Suspense>
      </div>
      
      <ExpensesArchiveGrid expenses={expenses} />
    </div>
  );
}
