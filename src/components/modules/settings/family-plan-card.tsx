"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { DeleteButton } from "@/components/ui/delete-button";
import { FAMILY_MAX_MEMBERS, removeFamilyMember, leaveFamily, type FamilyMemberRow } from "@/lib/data/family";
import { FamilyInviteDialog } from "./family-invite-dialog";
import { JoinFamilyCodeDialog } from "./join-family-code-dialog";

/** Ported from mobile's subscription_management_screen.dart `_FamilySection`
 * — burada mobilden farklı olarak sahip/üye ayrımı açıkça yapılıyor
 * (mobil `getMembers()`'ı sahip varsayarak çağırıyor, bir üye için boş
 * dönüp yanlışlıkla davet arayüzü gösteriyordu). Üyeler için gerçek bir
 * "Ayrıl" akışı da eklendi — mobilde `leave_family` RPC'si tanımlı ama hiç
 * çağrılmıyordu. */
export function FamilyPlanCard({
  userId,
  planType,
  isOwner,
  members,
  ownerName,
}: {
  userId: string;
  planType: string;
  isOwner: boolean;
  members: FamilyMemberRow[];
  ownerName: string | null;
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!window.confirm("Aile Paketinden ayrılmak istediğinize emin misiniz? Premium erişiminiz sona erecek.")) return;
    setLeaving(true);
    setError(null);
    try {
      await leaveFamily(createClient());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aile Paketinden ayrılamadınız.");
    } finally {
      setLeaving(false);
    }
  }

  if (planType !== "family") {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Aile Paketi</CardTitle>
          </CardHeader>
          <p className="mb-3 text-sm text-text-secondary">
            Size gönderilen bir davet kodunuz varsa buradan Aile Paketine katılabilirsiniz.
          </p>
          <Button variant="secondary" className="gap-1.5" onClick={() => setJoinCodeOpen(true)}>
            <Users className="h-4 w-4" /> Davet Kodun mu Var?
          </Button>
        </Card>
        <JoinFamilyCodeDialog open={joinCodeOpen} onClose={() => setJoinCodeOpen(false)} />
      </>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aile Paketi</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-text-secondary">
          {ownerName ? `"${ownerName}" adlı kullanıcının Aile Paketine üyesiniz.` : "Bir Aile Paketine üyesiniz."}
        </p>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        <Button variant="secondary" className="gap-1.5 text-danger" disabled={leaving} onClick={handleLeave}>
          <LogOut className="h-4 w-4" /> {leaving ? "Ayrılınıyor…" : "Aile Paketinden Ayrıl"}
        </Button>
      </Card>
    );
  }

  const atCap = members.length >= FAMILY_MAX_MEMBERS;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Aile Paketi</CardTitle>
        </CardHeader>
        {members.length === 0 ? (
          <p className="mb-3 text-sm text-text-secondary">Henüz üye eklemediniz.</p>
        ) : (
          <ul className="mb-3 divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{m.name}</p>
                  {m.email && <p className="truncate text-xs text-text-secondary">{m.email}</p>}
                </div>
                <DeleteButton
                  confirmMessage={`${m.name} Aile Paketinden çıkarılsın mı?`}
                  onDelete={() => removeFamilyMember(createClient(), m.memberId)}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mb-3 text-xs text-text-secondary">
          {members.length}/{FAMILY_MAX_MEMBERS} üye
        </p>
        <Button variant="secondary" className="gap-1.5" disabled={atCap} onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> {atCap ? "Üye Sınırına Ulaşıldı" : "Aile Üyesi Davet Et"}
        </Button>
      </Card>
      <FamilyInviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} ownerId={userId} />
    </>
  );
}
