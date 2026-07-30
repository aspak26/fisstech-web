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
 * live; sources gold from Truncgil, USD/EUR from TCMB's official feed, and
 * crypto from CoinGecko, no API key needed by design). Returns asset_type
 * key → TRY price, e.g. `gram_altin`, `bitcoin`, `dolar`. The edge function
 * fetches its 3 sources independently and fails soft PER SOURCE — an asset
 * whose source is down comes back as `0`, not omitted, so `0` here means
 * "no live price available", never a real free price. Zero values are
 * filtered out here (not just at the top level) so callers can tell
 * "no live price for THIS asset" apart from "actually worth zero" — the
 * whole map used to come back empty on any single-source failure, which
 * blanked out unrelated assets that had a perfectly good price. */
export async function getInvestmentPrices(supabase: SupabaseClient): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.functions.invoke<Record<string, number | string>>("get-investment-prices");
    if (error || !data) return {};
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "updated_at") continue;
      if (typeof value === "number" && value > 0) prices[key] = value;
    }
    return prices;
  } catch {
    return {};
  }
}
