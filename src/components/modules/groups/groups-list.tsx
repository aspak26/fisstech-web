"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { GroupRow } from "@/lib/data/groups";
import { CreateGroupDialog } from "./create-group-dialog";

export function GroupsList({ groups, userId }: { groups: GroupRow[]; userId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Grup
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Henüz bir gruba katılmadınız"
            description="Aile veya arkadaşlarınızla ortak bütçe takibi için bir grup oluşturun."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="transition-colors hover:border-accent">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{group.name}</p>
                    <p className="text-sm text-text-secondary">
                      {group.owner_id === userId ? "Sahibisin" : "Üyesin"}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateGroupDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
