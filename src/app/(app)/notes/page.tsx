import { createClient } from "@/lib/supabase/server";
import { getAllNotes } from "@/lib/data/notes";
import { NotesGrid } from "@/components/modules/notes/notes-grid";

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const notes = await getAllNotes(supabase, user!.id);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">Notlar</h1>
      <NotesGrid notes={notes} />
    </div>
  );
}
