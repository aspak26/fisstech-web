import type { SupabaseClient } from "@supabase/supabase-js";

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
  await supabase.from("investments").delete().eq("id", id);
}
