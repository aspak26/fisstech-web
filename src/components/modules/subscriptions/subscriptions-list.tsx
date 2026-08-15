"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { subscriptionMonthlyAmount } from "@/lib/subscriptions/analytics";
import { deleteSubscription, updateSubscriptionStatus } from "@/lib/data/subscriptions";
import type { CardsRow, SubscriptionsRow } from "@/lib/types/database";
import { SubscriptionFormDialog } from "./subscription-form-dialog";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  paused: "Duraklatıldı",
  cancelled: "İptal Edildi",
};

export function SubscriptionsList({
  subscriptions,
  cards,
}: {
  subscriptions: SubscriptionsRow[];
  cards: CardsRow[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionsRow | undefined>(undefined);

  const monthlyTotal = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + subscriptionMonthlyAmount(s), 0);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(sub: SubscriptionsRow) {
    setEditing(sub);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-text-secondary">Aylık toplam abonelik gideri</p>
        <p className="font-display text-xl font-semibold text-text-primary">
          {formatCurrency(monthlyTotal)}
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Abonelik Ekle
        </Button>
      </div>

      <Card>
        {subscriptions.length === 0 ? (
          <EmptyState icon={CreditCard} title="Henüz abonelik eklenmedi" />
        ) : (
          <ul className="divide-y divide-border">
            {subscriptions.map((sub) => (
              <li key={sub.id} className="flex items-center justify-between gap-3 py-3">
                <button type="button" onClick={() => openEdit(sub)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-text-primary">{sub.name}</p>
                    <Badge tone={sub.status === "active" ? "success" : "neutral"}>
                      {STATUS_LABEL[sub.status] ?? sub.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {sub.frequency === "yearly" ? "Yıllık" : "Aylık"} · Yenilenme: {sub.renewal_date}
                    {sub.card_label ? ` · ${sub.card_label}` : ""}
                  </p>
                </button>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(sub.amount))}
                </span>
                {sub.status === "active" ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:underline"
                    onClick={async () => {
                      await updateSubscriptionStatus(createClient(), sub.id, "paused");
                      router.refresh();
                    }}
                  >
                    Duraklat
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-medium text-accent hover:underline"
                    onClick={async () => {
                      await updateSubscriptionStatus(createClient(), sub.id, "active");
                      router.refresh();
                    }}
                  >
                    Etkinleştir
                  </button>
                )}
                <DeleteButton
                  confirmMessage={`"${sub.name}" aboneliği silinsin mi?`}
                  onDelete={() => deleteSubscription(createClient(), sub.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SubscriptionFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        subscription={editing}
        cards={cards}
      />
    </div>
  );
}
