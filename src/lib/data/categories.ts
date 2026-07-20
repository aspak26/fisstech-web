import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryOption } from "@/lib/scan/types";
import type { CategoriesRow } from "@/lib/types/database";

/** Categories visible to the current user (system defaults + their own),
 * shaped for the scan-receipt edge function's expected {name, group, emoji}. */
export async function getCategoriesForScan(
  supabase: SupabaseClient,
): Promise<CategoryOption[]> {
  const rows = await getCategoriesFull(supabase);
  return rows.map((c) => ({
    name: c.name,
    group: c.parent_group ?? "",
    emoji: c.icon,
  }));
}

/** Full category rows (with id), for building name<->id maps on the client. */
export async function getCategoriesFull(supabase: SupabaseClient): Promise<CategoriesRow[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  return (data ?? []) as CategoriesRow[];
}

/** Ported from mobile's ExpenseService.addCustomCategory — same fixed
 * placeholder color (#546E7A), default icon (📦) when none given. */
export async function createCategory(
  supabase: SupabaseClient,
  userId: string,
  { name, parentGroup, icon }: { name: string; parentGroup: string; icon: string },
): Promise<CategoriesRow> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
      icon: icon.trim() || "📦",
      color: "#546E7A",
      parent_group: parentGroup,
      user_id: userId,
    })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Kategori eklenemedi");
  return data as CategoriesRow;
}
