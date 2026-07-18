import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthRange } from "@/lib/utils/date";

export interface CategoryBreakdownPoint {
  name: string;
  color: string;
  total: number;
}

export async function getCategoryBreakdown(
  supabase: SupabaseClient,
  userId: string,
  month: string,
): Promise<CategoryBreakdownPoint[]> {
  try {
    const { start, end } = getMonthRange(month);
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    const expenseIds = (expenses ?? []).map((e) => e.id as string);
    if (expenseIds.length === 0) return [];

    const { data: items } = await supabase
      .from("expense_items")
      .select("price, quantity, category_id")
      .in("expense_id", expenseIds);

    const { data: categories } = await supabase.from("categories").select("id, name, color");
    const categoryMap = new Map(
      (categories ?? []).map((c: { id: string; name: string; color: string }) => [
        c.id,
        { name: c.name, color: c.color },
      ]),
    );

    const totals = new Map<string, number>();
    for (const item of items ?? []) {
      const key = (item.category_id as string | null) ?? "diger";
      const amount = Number(item.price) * Number(item.quantity);
      totals.set(key, (totals.get(key) ?? 0) + amount);
    }

    return [...totals.entries()]
      .map(([id, total]) => ({
        name: categoryMap.get(id)?.name ?? "Diğer",
        color: categoryMap.get(id)?.color ?? "#8C7A80",
        total,
      }))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}
