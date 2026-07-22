"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { cancelInvite, removeStaffMember, type StaffWithUser } from "@/lib/data/esnaf-team";
import type { BusinessInviteRow, BusinessStaffRole } from "@/lib/types/esnaf";
import { TeamInviteDialog } from "./team-invite-dialog";

const ROLE_LABELS: Record<BusinessStaffRole, string> = {
  yardimci_yonetici: "Yardımcı Yönetici",
  personel: "Personel",
};

export function TeamRoster({
  businessId,
  staff,
  pendingInvites,
  staffCount,
  staffLimit,
}: {
  businessId: string;
  staff: StaffWithUser[];
  pendingInvites: BusinessInviteRow[];
  staffCount: number;
  staffLimit: number;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const quotaFull = staffCount >= staffLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {staffCount}/{staffLimit} personel kullanılıyor
        </p>
        <Button onClick={() => setDialogOpen(true)} disabled={quotaFull} className="gap-1.5">
          <Plus className="h-4 w-4" /> Davet Kodu Oluştur
        </Button>
      </div>
      {quotaFull && (
        <p className="text-xs text-warning">
          Personel limitine ulaştınız. Daha fazla personel eklemek için Esnaf Modu paketinizi yükseltin.
        </p>
      )}

      <Card>
        <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Aktif Ekip</h2>
        {staff.length === 0 ? (
          <EmptyState icon={Users} title="Henüz ekip üyesi yok" />
        ) : (
          <ul className="divide-y divide-border">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={s.userName || s.userEmail || "?"} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {s.userName || s.userEmail || "Kullanıcı"}
                    </p>
                    <Badge tone="accent" className="mt-0.5">
                      {ROLE_LABELS[s.role]}
                    </Badge>
                  </div>
                </div>
                <DeleteButton
                  confirmMessage={`"${s.userName || s.userEmail}" ekipten çıkarılsın mı?`}
                  onDelete={() => removeStaffMember(createClient(), s.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {pendingInvites.length > 0 && (
        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Bekleyen Davetler</h2>
          <ul className="divide-y divide-border">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-text-secondary" />
                  <div>
                    <p className="font-mono text-sm text-text-primary">{inv.token}</p>
                    <p className="text-xs text-text-secondary">{ROLE_LABELS[inv.role]}</p>
                  </div>
                </div>
                <DeleteButton
                  confirmMessage="Bu davet iptal edilsin mi?"
                  onDelete={() => cancelInvite(createClient(), inv.id)}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <TeamInviteDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          router.refresh();
        }}
        businessId={businessId}
      />
    </div>
  );
}
