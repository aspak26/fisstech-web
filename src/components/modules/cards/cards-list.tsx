"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CreditCard, Wallet, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { cardColorToHex, cardDisplayLabel, deleteCard } from "@/lib/data/cards";
import type { CardsRow } from "@/lib/types/database";
import { CardFormDialog } from "./card-form-dialog";

export function CardsList({
  cards,
  monthlySpentByCard,
}: {
  cards: CardsRow[];
  monthlySpentByCard: Map<string, number>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CardsRow | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Kart Ekle
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="Henüz kartın yok"
            description="Kredi veya banka kartını ekle, harcamalarını karta göre takip et."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((c) => {
            const accent = cardColorToHex(c.color) ?? "var(--color-accent)";
            const spent = monthlySpentByCard.get(c.id) ?? 0;
            const hasLimit = c.limit_amount != null && Number(c.limit_amount) > 0;
            const progress = hasLimit ? Math.min(1, spent / Number(c.limit_amount)) : 0;
            const isExceeded = hasLimit && spent > Number(c.limit_amount!);
            const isWarning = hasLimit && !isExceeded && progress >= 0.8;
            const barColor = isExceeded ? "bg-danger" : isWarning ? "bg-warning" : "bg-success";

            return (
              <Card key={c.id} className="relative overflow-hidden p-0" style={{ borderColor: `${accent}55` }}>
                <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accent }} />
                <Link href={`/cards/${c.id}`} className="block p-5 pl-6 hover:bg-surface-hover">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${accent}26`, color: accent }}
                    >
                      {c.card_type === "debit_card" ? <Wallet className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-text-primary">{cardDisplayLabel(c)}</p>
                      <p className="text-sm text-text-secondary">{c.card_type === "debit_card" ? "Banka Kartı" : "Kredi Kartı"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Bu Ay</p>
                      <p className="font-medium text-text-primary">{formatCurrency(spent)}</p>
                    </div>
                  </div>
                  {hasLimit && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${progress * 100}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatCurrency(spent)} / {formatCurrency(Number(c.limit_amount))} limit
                      </p>
                    </div>
                  )}
                </Link>
                <div className="absolute right-3 top-3 flex gap-1">
                  <button
                    type="button"
                    aria-label="Kartı düzenle"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(c);
                      setDialogOpen(true);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-control bg-surface/80 text-text-secondary hover:text-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <span onClick={(e) => e.preventDefault()}>
                    <DeleteButton
                      confirmMessage={`"${cardDisplayLabel(c)}" kartını silmek istiyor musun? Bu karta bağlı harcamalar silinmez, sadece kart bağlantısı kaldırılır.`}
                      onDelete={() => deleteCard(createClient(), c.id)}
                    />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CardFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        card={editing}
      />
    </div>
  );
}
