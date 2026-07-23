"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Shield, UserMinus, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { removeMember, saveUserAlias, updateMemberRole, type GroupMemberRow } from "@/lib/data/groups";
import { InviteDialog } from "./invite-dialog";

const ROLE_LABELS: Record<string, string> = { owner: "Sahip", admin: "Yönetici", member: "Üye" };

/** Ported from mobile's group_settings_screen.dart _MemberTile — owner sees
 * promote/demote/remove for others; everyone can set a private alias for
 * other members. */
export function MemberList({
  groupId,
  members,
  currentUserId,
  isOwner,
}: {
  groupId: string;
  members: GroupMemberRow[];
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [aliasFor, setAliasFor] = useState<GroupMemberRow | null>(null);
  const [aliasInput, setAliasInput] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  async function handleRoleChange(member: GroupMemberRow, role: "admin" | "member") {
    setMenuFor(null);
    await updateMemberRole(createClient(), groupId, member.id, role);
    router.refresh();
  }

  async function handleRemove(member: GroupMemberRow) {
    setMenuFor(null);
    if (!window.confirm(`"${member.name}" gruptan çıkarılsın mı?`)) return;
    await removeMember(createClient(), groupId, member.userId);
    router.refresh();
  }

  function openAlias(member: GroupMemberRow) {
    setMenuFor(null);
    setAliasInput(member.customAlias ?? "");
    setAliasFor(member);
  }

  async function saveAlias() {
    if (!aliasFor) return;
    await saveUserAlias(createClient(), currentUserId, aliasFor.userId, aliasInput);
    setAliasFor(null);
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-text-primary">Üyeler</h2>
        {isOwner && (
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Davet Et
          </Button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={m.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">{m.name}</p>
              {m.email && <p className="truncate text-xs text-text-secondary">{m.email}</p>}
            </div>
            <Badge tone={m.role === "owner" ? "accent" : "neutral"}>{ROLE_LABELS[m.role] ?? m.role}</Badge>
            <div className="relative">
              <button
                type="button"
                aria-label="Üye seçenekleri"
                onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                className="flex h-8 w-8 items-center justify-center rounded-control text-text-secondary hover:bg-bg"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuFor === m.id && (
                <div className="absolute right-0 top-9 z-10 w-52 rounded-card border border-border bg-surface p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => openAlias(m)}
                    className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Takma Ad Belirle
                  </button>
                  {isOwner && m.userId !== currentUserId && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRoleChange(m, m.role === "admin" ? "member" : "admin")}
                        className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
                      >
                        <Shield className="h-3.5 w-3.5" /> {m.role === "admin" ? "Üye Yap" : "Yönetici Yap"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(m)}
                        className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Çıkar
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!aliasFor} onClose={() => setAliasFor(null)} title={`${aliasFor?.name ?? ""} için Takma Ad`}>
        <div className="space-y-4">
          <Input
            autoFocus
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            placeholder="örn. Babam, Annem, Ahmet Abi"
          />
          <p className="text-xs text-text-secondary">Bu takma ad sadece sana görünür, diğer üyeler kendi taktıkları adı görür.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAliasFor(null)}>
              İptal
            </Button>
            <Button type="button" onClick={saveAlias}>
              Kaydet
            </Button>
          </div>
        </div>
      </Dialog>

      <InviteDialog
        key={inviteOpen ? "open" : "closed"}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupId={groupId}
        userId={currentUserId}
      />
    </Card>
  );
}
