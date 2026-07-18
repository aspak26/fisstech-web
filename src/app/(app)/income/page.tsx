import { createClient } from "@/lib/supabase/server";
import {
  getFixedExpenseCategories,
  getFixedExpensesFull,
  getIncomeCategories,
  getIncomes,
} from "@/lib/data/income";
import { IncomePanel } from "@/components/modules/income/income-panel";

export default async function IncomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [incomes, fixedExpenses, incomeCategories, fixedExpenseCategories] = await Promise.all([
    getIncomes(supabase, userId),
    getFixedExpensesFull(supabase, userId),
    getIncomeCategories(supabase),
    getFixedExpenseCategories(supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">
        Gelirlerim & Sabit Giderler
      </h1>
      <IncomePanel
        incomes={incomes}
        fixedExpenses={fixedExpenses}
        incomeCategories={incomeCategories}
        fixedExpenseCategories={fixedExpenseCategories}
      />
    </div>
  );
}
