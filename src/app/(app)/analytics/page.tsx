import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCategoryBreakdowns, getMonthlyExpenseTrend, getStoreBreakdown } from "@/lib/data/analytics";
import { getMonthlyBalanceTrend } from "@/lib/data/balance";
import { getSubscriptions } from "@/lib/data/subscriptions";
import { getGroups, getMemberSpendTotals } from "@/lib/data/groups";
import { getCategoryLimits } from "@/lib/data/limits";
import { getCategoriesFull } from "@/lib/data/categories";
import { getCards, getCardTotals, getCardCategoryTotals } from "@/lib/data/cards";
import { DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { currentMonthString } from "@/lib/utils/date";
import { PeriodSelector } from "@/components/ui/period-selector";
import { AnalyticsTabsNav } from "@/components/modules/analytics/analytics-tabs-nav";
import { ExpensesAnalyticsTab } from "@/components/modules/analytics/expenses-analytics-tab";
import { IncomeExpenseAnalyticsTab } from "@/components/modules/analytics/income-expense-analytics-tab";
import { SubscriptionsAnalyticsTab } from "@/components/modules/analytics/subscriptions-analytics-tab";
import { GroupAnalyticsTab } from "@/components/modules/analytics/group-analytics-tab";

type Tab = "expenses" | "income" | "subscriptions" | "group";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; tab?: string; groupId?: string }>;
}) {
  const { period: periodParam, tab: tabParam, groupId: groupIdParam } = await searchParams;
  const period = periodParam ?? DEFAULT_BUDGET_PERIOD;
  const tab = (tabParam as Tab) ?? "expenses";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  let content: React.ReactNode;

  if (tab === "income") {
    const trend = await getMonthlyBalanceTrend(supabase, userId, 6);
    content = <IncomeExpenseAnalyticsTab trend={trend} />;
  } else if (tab === "subscriptions") {
    const subscriptions = await getSubscriptions(supabase, userId);
    content = <SubscriptionsAnalyticsTab subscriptions={subscriptions} />;
  } else if (tab === "group") {
    const groups = await getGroups(supabase);
    const groupId = groupIdParam && groups.some((g) => g.id === groupIdParam) ? groupIdParam : groups[0]?.id;
    const totals = groupId ? await getMemberSpendTotals(supabase, groupId, period) : [];
    content = <GroupAnalyticsTab groups={groups} groupId={groupId ?? ""} totals={totals} />;
  } else {
    const [breakdowns, storeBreakdown, monthlyTrend, limits, categories, cards, cardTotals] = await Promise.all([
      getCategoryBreakdowns(supabase, userId, period),
      getStoreBreakdown(supabase, userId, period),
      getMonthlyExpenseTrend(supabase, userId, 6),
      getCategoryLimits(supabase, userId),
      getCategoriesFull(supabase),
      getCards(supabase, userId),
      getCardTotals(supabase, userId, period),
    ]);
    const cardCategoryEntries = await Promise.all(
      cards.map(async (c) => [c.id, await getCardCategoryTotals(supabase, c.id, period)] as const),
    );
    const cardCategoryBreakdowns = new Map(cardCategoryEntries);
    content = (
      <ExpensesAnalyticsTab
        breakdown={breakdowns.item}
        parentBreakdown={breakdowns.parent}
        storeBreakdown={storeBreakdown}
        monthlyTrend={monthlyTrend}
        limits={limits}
        categories={categories}
        currentMonth={currentMonthString()}
        cards={cards}
        cardTotals={cardTotals}
        cardCategoryBreakdowns={cardCategoryBreakdowns}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Analizler & Raporlar</h1>
        {tab !== "subscriptions" && (
          <Suspense fallback={<div className="h-10 w-32" />}>
            <PeriodSelector period={period} />
          </Suspense>
        )}
      </div>

      <Suspense fallback={<div className="h-11" />}>
        <AnalyticsTabsNav tab={tab} />
      </Suspense>

      {content}
    </div>
  );
}
