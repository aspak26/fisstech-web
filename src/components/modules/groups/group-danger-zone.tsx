"use client";

import { useRouter } from "next/navigation";
import { LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteGroup, removeMember } from "@/lib/data/groups";

/** Ported from mobile's group_settings_screen.dart — owner can only delete
 * the whole group (no ownership transfer in mobile, replicated as-is);
 * non-owners can leave. */
export function GroupDangerZone({ groupId, isOwner, userId }: { groupId: string; isOwner: boolean; userId: string }) {
  const router = useRouter();

  async function handleLeave() {
    if (!window.confirm("Bu gruptan ayrılmak istediğine emin misin?")) return;
    await removeMember(createClient(), groupId, userId);
    router.push("/groups");
  }

  async function handleDelete() {
    if (!window.confirm("Bu grup kalıcı olarak silinecek. Emin misin?")) return;
    await deleteGroup(createClient(), groupId);
    router.push("/groups");
  }

  return (
    <Card className="border-danger/30">
      {isOwner ? (
        <Button variant="danger" className="w-full gap-1.5" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" /> Grubu Sil
        </Button>
      ) : (
        <Button variant="danger" className="w-full gap-1.5" onClick={handleLeave}>
          <LogOut className="h-4 w-4" /> Gruptan Ayrıl
        </Button>
      )}
    </Card>
  );
}
