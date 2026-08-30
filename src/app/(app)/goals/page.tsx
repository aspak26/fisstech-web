import { createClient } from "@/lib/supabase/server";
import { getGoals, getSavingsPool, getPoolTransferNetForMonth } from "@/lib/data/goals";
import { getFixedExpensesFull, getIncomes } from "@/lib/data/income";
import { getExpenses } from "@/lib/data/expenses";
import { calculatePeriodRange, DEFAULT_BUDGET_PERIOD } from "@/lib/utils/period";
import { GoalsList } from "@/components/modules/goals/goals-list";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;
  const now = new Date();
  const range = calculatePeriodRange(DEFAULT_BUDGET_PERIOD);

  const [goals, pool, incomes, fixedExpenses, expenses, poolTransferNet] = await Promise.all([
    getGoals(supabase, userId),
    getSavingsPool(supabase, userId),
    getIncomes(supabase, userId, range),
    getFixedExpensesFull(supabase, userId),
    getExpenses(supabase, userId, range),
    getPoolTransferNetForMonth(supabase, userId, now.getFullYear(), now.getMonth() + 1),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalFixed = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
  const totalVariable = expenses.reduce((s, e) => s + Number(e.total), 0);
  // Havuza aktarılan/çekilen para bu ayki net bakiyeyi doğrudan etkiler —
  // aynı mantık mobil GoalsService/BudgetSummary.netBalance ile birebir.
  const netBalance = totalIncome - totalFixed - totalVariable - poolTransferNet;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Hedeflerim</h1>
      <GoalsList goals={goals} pool={pool} netBalance={netBalance} />
    </div>
  );
}
