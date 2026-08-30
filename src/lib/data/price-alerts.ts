import type { SupabaseClient } from "@supabase/supabase-js";

export interface PriceAlertRow {
  id: string;
  user_id: string;
  asset_type: string;
  target_price: number;
  direction: "above" | "below";
  note: string | null;
  is_active: boolean;
  is_triggered: boolean;
  created_at: string;
}

/** Ported from mobile's PriceAlertService — aynı `price_alerts` tablosu. */
export async function getPriceAlerts(supabase: SupabaseClient, userId: string): Promise<PriceAlertRow[]> {
  const { data } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PriceAlertRow[];
}

export async function addPriceAlert(
  supabase: SupabaseClient,
  userId: string,
  input: { assetType: string; targetPrice: number; direction: "above" | "below"; note?: string | null },
): Promise<void> {
  const { error } = await supabase.from("price_alerts").insert({
    user_id: userId,
    asset_type: input.assetType,
    target_price: input.targetPrice,
    direction: input.direction,
    note: input.note?.trim() ? input.note.trim() : null,
  });
  if (error) throw error;
}

export async function toggleAlertActive(supabase: SupabaseClient, id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("price_alerts").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deletePriceAlert(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("price_alerts").delete().eq("id", id);
  if (error) throw error;
}

export function isAlertTriggeredBy(alert: PriceAlertRow, currentPrice: number): boolean {
  return alert.direction === "above" ? currentPrice >= alert.target_price : currentPrice <= alert.target_price;
}
