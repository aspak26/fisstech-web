import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionsRow } from "@/lib/types/database";
import { requireUserId } from "@/lib/utils/auth";

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
  const userId = await requireUserId(supabase);
  await supabase.from("subscriptions").delete().eq("id", id).eq("user_id", userId);
}

export async function updateSubscriptionStatus(
  supabase: SupabaseClient,
  id: string,
  status: "active" | "paused" | "cancelled",
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("subscriptions").update({ status }).eq("id", id).eq("user_id", userId);
}
