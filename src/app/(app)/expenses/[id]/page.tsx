import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExpenseById } from "@/lib/data/expenses";
import { getCategoriesForScan, getCategoriesFull } from "@/lib/data/categories";
import { getGroups } from "@/lib/data/groups";
import { ExpenseDetail } from "@/components/modules/expenses/expense-detail";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [expense, categories, categoriesFull, groups] = await Promise.all([
    getExpenseById(supabase, id, user.id),
    getCategoriesForScan(supabase),
    getCategoriesFull(supabase),
    getGroups(supabase),
  ]);

  if (!expense) notFound();

  const categoryNamesById: [string, string][] = categoriesFull.map((c) => [c.id, c.name]);

  return (
    <div className="mx-auto max-w-2xl">
      <ExpenseDetail
        expense={expense}
        categories={categories}
        categoryNamesById={categoryNamesById}
        groups={groups}
      />
    </div>
  );
}
