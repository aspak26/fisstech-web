import type { SupabaseClient } from "@supabase/supabase-js";

export interface CashFlowForecastDay {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  projectedBalance: number;
  reason: string;
}

interface CashflowForecastRow {
  forecast_date: string;
  predicted_income: number;
  predicted_expense: number;
  projected_balance: number;
  reason: string;
}

/** get_cashflow_forecast(p_user_id) — paylaşılan Supabase RPC'si (mobil
 * tarafın 088_cashflow_forecast.sql migration'ı), önümüzdeki 30 gün için
 * günlük tahmini bakiye döner. */
export async function getCashflowForecast(
  supabase: SupabaseClient,
  userId: string,
): Promise<CashFlowForecastDay[]> {
  try {
    const { data, error } = await supabase.rpc("get_cashflow_forecast", { p_user_id: userId });
    if (error) throw error;
    return ((data ?? []) as CashflowForecastRow[]).map((row) => ({
      date: row.forecast_date,
      predictedIncome: Number(row.predicted_income),
      predictedExpense: Number(row.predicted_expense),
      projectedBalance: Number(row.projected_balance),
      reason: row.reason,
    }));
  } catch {
    return [];
  }
}
