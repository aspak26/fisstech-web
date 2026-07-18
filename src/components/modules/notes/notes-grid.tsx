"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, StickyNote, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { cn } from "@/lib/utils/cn";
import { deleteNote, toggleNoteCompleted } from "@/lib/data/notes";
import type { UserNotesRow } from "@/lib/types/database";
import { NoteFormDialog } from "./note-form-dialog";

const COLOR_BORDER: Record<UserNotesRow["color"], string> = {
  red: "border-l-danger",
  blue: "border-l-accent",
  green: "border-l-success",
};

export function NotesGrid({ notes }: { notes: UserNotesRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Not
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Henüz not eklenmedi" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "rounded-card border border-l-4 border-border bg-surface p-4",
                COLOR_BORDER[note.color],
                note.is_completed && "opacity-60",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className={cn("font-medium text-text-primary", note.is_completed && "line-through")}>
                  {note.title || "Başlıksız not"}
                </p>
                <DeleteButton
                  confirmMessage="Bu not silinsin mi?"
                  onDelete={() => deleteNote(createClient(), note.id)}
                />
              </div>
              {note.body && (
                <p className="mb-3 whitespace-pre-wrap text-sm text-text-secondary">{note.body}</p>
              )}
              <button
                type="button"
                onClick={async () => {
                  await toggleNoteCompleted(createClient(), note.id, !note.is_completed);
                  router.refresh();
                }}
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  note.is_completed ? "text-success" : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Check className="h-3.5 w-3.5" />
                {note.is_completed ? "Tamamlandı" : "Tamamlandı olarak işaretle"}
              </button>
            </div>
          ))}
        </div>
      )}

      <NoteFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
