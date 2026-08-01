import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getExpenses } from "@/lib/data/expenses";
import { getCategoriesFull } from "@/lib/data/categories";
import { getGroups } from "@/lib/data/groups";
import { calculatePeriodRange, DEFAULT_EXPENSE_PERIOD } from "@/lib/utils/period";
import { PeriodSelector } from "@/components/ui/period-selector";
import { ExpensesList } from "@/components/modules/expenses/expenses-list";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = periodParam ?? DEFAULT_EXPENSE_PERIOD;
  const { start, end } = calculatePeriodRange(period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [expenses, categoriesFull, groups] = await Promise.all([
    getExpenses(supabase, userId, { start, end }),
    getCategoriesFull(supabase),
    getGroups(supabase),
  ]);

  const categories = categoriesFull.map((c) => ({
    name: c.name,
    group: c.parent_group ?? "",
    emoji: c.icon,
  }));
  const categoryNamesById: [string, string][] = categoriesFull.map((c) => [c.id, c.name]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Harcamalarım</h1>
        <Suspense fallback={<div className="h-10 w-32" />}>
          <PeriodSelector period={period} />
        </Suspense>
      </div>
      <ExpensesList
        expenses={expenses}
        categories={categories}
        categoryNamesById={categoryNamesById}
        groups={groups}
      />
    </div>
  );
}
