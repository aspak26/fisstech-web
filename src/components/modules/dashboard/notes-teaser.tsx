import { StickyNote } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { UserNotesRow } from "@/lib/types/database";

const COLOR_DOT: Record<UserNotesRow["color"], string> = {
  red: "bg-danger",
  blue: "bg-accent",
  green: "bg-success",
};

export function NotesTeaser({ notes }: { notes: UserNotesRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notlarım</CardTitle>
      </CardHeader>
      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Henüz not eklenmedi" />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start gap-2.5">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${COLOR_DOT[note.color]}`} />
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {note.title || "Başlıksız not"}
                </p>
                {note.body && (
                  <p className="line-clamp-1 text-sm text-text-secondary">{note.body}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
