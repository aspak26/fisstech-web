import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserNotesRow } from "@/lib/types/database";
import { requireUserId } from "@/lib/utils/auth";

export async function getAllNotes(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserNotesRow[]> {
  try {
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return (data ?? []) as UserNotesRow[];
  } catch {
    return [];
  }
}

export async function deleteNote(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("user_notes").delete().eq("id", id).eq("user_id", userId);
}

export async function toggleNoteCompleted(
  supabase: SupabaseClient,
  id: string,
  isCompleted: boolean,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("user_notes")
    .update({ is_completed: isCompleted, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}
