import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { currentMonthString } from "@/lib/utils/date";
import {
  getActiveSubscriptions,
  getFixedExpenses,
  getGroupMembershipCount,
  getMonthlyExpenseSummary,
  getMonthlyIncomeTotal,
  getNotesTeaser,
  getRecentExpenses,
} from "@/lib/data/dashboard";
import { MonthSelector } from "@/components/modules/dashboard/month-selector";
import { MonthlyTotalHero } from "@/components/modules/dashboard/monthly-total-hero";
import { SummaryTriple } from "@/components/modules/dashboard/summary-triple";
import { GroupBudgetSection } from "@/components/modules/dashboard/group-budget-section";
import { QuickAccessGrid } from "@/components/modules/dashboard/quick-access-grid";
import { NotesTeaser } from "@/components/modules/dashboard/notes-teaser";
import { SubscriptionsSection } from "@/components/modules/dashboard/subscriptions-section";
import { SummaryReportCard } from "@/components/modules/dashboard/summary-report-card";
import { FixedExpensesList } from "@/components/modules/dashboard/fixed-expenses-list";
import { RecentExpensesList } from "@/components/modules/dashboard/recent-expenses-list";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? currentMonthString();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [expenseSummary, incomeTotal, fixedExpenses, recentExpenses, notes, groupCount, activeSubscriptions] =
    await Promise.all([
      getMonthlyExpenseSummary(supabase, userId, month),
      getMonthlyIncomeTotal(supabase, userId, month),
      getFixedExpenses(supabase, userId),
      getRecentExpenses(supabase, userId),
      getNotesTeaser(supabase, userId),
      getGroupMembershipCount(supabase, userId),
      getActiveSubscriptions(supabase, userId),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Suspense fallback={<div className="h-9" />}>
        <MonthSelector month={month} />
      </Suspense>

      <MonthlyTotalHero total={expenseSummary.total} count={expenseSummary.count} />

      <SummaryTriple income={incomeTotal} expense={expenseSummary.total} />

      <GroupBudgetSection membershipCount={groupCount} />

      <QuickAccessGrid />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NotesTeaser notes={notes} />
        <SummaryReportCard />
      </div>

      <FixedExpensesList items={fixedExpenses} />

      <SubscriptionsSection subscriptions={activeSubscriptions} />

      <RecentExpensesList expenses={recentExpenses} />
    </div>
  );
}
