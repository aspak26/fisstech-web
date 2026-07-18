import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionsRow } from "@/lib/types/database";

export async function getSubscriptions(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionsRow[]> {
  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("renewal_date");
    return (data ?? []) as SubscriptionsRow[];
  } catch {
    return [];
  }
}

export async function deleteSubscription(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("subscriptions").delete().eq("id", id);
}

export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  id: string,
  status: "active" | "paused" | "cancelled",
): Promise<void> {
  await supabase.from("subscriptions").update({ status }).eq("id", id);
}
