import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryOption } from "@/lib/scan/types";

/** Categories visible to the current user (system defaults + their own),
 * shaped for the scan-receipt edge function's expected {name, group, emoji}. */
export async function getCategoriesForScan(
  supabase: SupabaseClient,
): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from("categories")
    .select("name, parent_group, icon")
    .order("name");

  return (data ?? []).map((c) => ({
    name: c.name as string,
    group: (c.parent_group as string | null) ?? "",
    emoji: c.icon as string,
  }));
}
