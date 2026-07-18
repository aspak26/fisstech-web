import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthRange, shiftMonth, currentMonthString, formatMonthLabel } from "@/lib/utils/date";

export interface MonthlyBalancePoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

/** Last `months` months (oldest first) of income vs. expense totals. */
export async function getMonthlyBalanceTrend(
  supabase: SupabaseClient,
  userId: string,
  months = 6,
): Promise<MonthlyBalancePoint[]> {
  const monthKeys: string[] = [];
  let cursor = currentMonthString();
  for (let i = 0; i < months; i++) {
    monthKeys.unshift(cursor);
    cursor = shiftMonth(cursor, -1);
  }

  try {
    const points = await Promise.all(
      monthKeys.map(async (month) => {
        const { start, end } = getMonthRange(month);
        const [expensesRes, incomesRes] = await Promise.all([
          supabase.from("expenses").select("total").eq("user_id", userId).gte("date", start).lte("date", end),
          supabase.from("incomes").select("amount").eq("user_id", userId).gte("date", start).lte("date", end),
        ]);
        const expense = (expensesRes.data ?? []).reduce((s, r) => s + Number(r.total), 0);
        const income = (incomesRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
        return { month, label: formatMonthLabel(month), income, expense, net: income - expense };
      }),
    );
    return points;
  } catch {
    return monthKeys.map((month) => ({ month, label: formatMonthLabel(month), income: 0, expense: 0, net: 0 }));
  }
}
