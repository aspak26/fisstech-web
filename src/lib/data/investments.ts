import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/utils/auth";

export interface InvestmentRow {
  id: string;
  user_id: string;
  asset_type: string;
  amount: number;
  purchase_price: number | null;
  purchase_date: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function getInvestments(
  supabase: SupabaseClient,
  userId: string,
): Promise<InvestmentRow[]> {
  try {
    const { data } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as InvestmentRow[];
  } catch {
    return [];
  }
}

export async function deleteInvestment(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("investments").delete().eq("id", id).eq("user_id", userId);
}

/** Ported from mobile's InvestmentPriceService.fetchPrices — same
 * `get-investment-prices` Supabase Edge Function (already deployed and
 * live; sources Truncgil for gold/currency + CoinGecko for crypto, no API
 * key needed by design). Returns asset_type key → TRY price, e.g.
 * `gram_altin`, `bitcoin`, `dolar`. Fails soft to an empty map so the list
 * still renders (purchase-cost-only) if the function is briefly down. */
export async function getInvestmentPrices(supabase: SupabaseClient): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.functions.invoke<Record<string, number | string>>("get-investment-prices");
    if (error || !data) return {};
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "updated_at") continue;
      if (typeof value === "number") prices[key] = value;
    }
    return prices;
  } catch {
    return {};
  }
}
