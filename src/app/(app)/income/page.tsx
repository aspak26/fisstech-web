import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getFixedExpenseCategories,
  getFixedExpensesFull,
  getIncomeCategories,
  getIncomes,
} from "@/lib/data/income";
import { getExpenses } from "@/lib/data/expenses";
import { getCategoriesFull } from "@/lib/data/categories";
import { calculatePeriodRange, DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { PeriodSelector } from "@/components/ui/period-selector";
import { IncomePanel } from "@/components/modules/income/income-panel";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = periodParam ?? DEFAULT_BUDGET_PERIOD;
  const range = calculatePeriodRange(period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [incomes, fixedExpenses, incomeCategories, fixedExpenseCategories, expenses, itemCategories] =
    await Promise.all([
      getIncomes(supabase, userId, range),
      getFixedExpensesFull(supabase, userId),
      getIncomeCategories(supabase),
      getFixedExpenseCategories(supabase),
      getExpenses(supabase, userId, range),
      getCategoriesFull(supabase),
    ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Gelirlerim & Sabit Giderler
        </h1>
        <Suspense fallback={<div className="h-10 w-32" />}>
          <PeriodSelector period={period} />
        </Suspense>
      </div>
      <IncomePanel
        incomes={incomes}
        fixedExpenses={fixedExpenses}
        expenses={expenses}
        incomeCategories={incomeCategories}
        fixedExpenseCategories={fixedExpenseCategories}
        itemCategories={itemCategories}
        periodLabel={range.label}
      />
    </div>
  );
}
