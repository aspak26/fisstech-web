import { createClient } from "@/lib/supabase/server";
import { getExpenses } from "@/lib/data/expenses";
import { getCategoriesForScan, getCategoriesFull } from "@/lib/data/categories";
import { ExpensesList } from "@/components/modules/expenses/expenses-list";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [expenses, categories, categoriesFull] = await Promise.all([
    getExpenses(supabase, userId),
    getCategoriesForScan(supabase),
    getCategoriesFull(supabase),
  ]);

  const categoryNamesById: [string, string][] = categoriesFull.map((c) => [c.id, c.name]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Harcamalarım</h1>
      <ExpensesList expenses={expenses} categories={categories} categoryNamesById={categoryNamesById} />
    </div>
  );
}
