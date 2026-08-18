"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Pencil, Trash2, Wallet, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cardColorToHex, cardDisplayLabel, deleteCard, type CardExpenseRow } from "@/lib/data/cards";
import { SUPPORTED_BANKS } from "@/lib/data/banks";
import type { CardsRow } from "@/lib/types/database";
import { CardFormDialog } from "./card-form-dialog";
import { BankLogo } from "./bank-logo";

export function CardDetail({
  card,
  expenses,
  monthlySpent,
}: {
  card: CardsRow;
  expenses: CardExpenseRow[];
  monthlySpent: number;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const accent = cardColorToHex(card.color) ?? "var(--color-accent)";

  const hasLimit = card.limit_amount != null && Number(card.limit_amount) > 0;
  const limit = hasLimit ? Number(card.limit_amount) : 0;
  const progress = hasLimit ? Math.min(1, monthlySpent / limit) : 0;
  const isExceeded = hasLimit && monthlySpent > limit;
  const isWarning = hasLimit && !isExceeded && progress >= 0.8;
  const barColor = isExceeded ? "text-danger" : isWarning ? "text-warning" : "text-accent";

  async function handleDelete() {
    if (!window.confirm(`"${cardDisplayLabel(card)}" kartını silmek istiyor musun? Bu karta bağlı harcamalar silinmez, sadece kart bağlantısı kaldırılır.`)) return;
    setDeleting(true);
    try {
      await deleteCard(createClient(), card.id);
      router.push("/cards");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kartlarım
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Düzenle
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Sil
          </Button>
        </div>
      </div>

      <Card style={{ borderColor: `${accent}55` }}>
        <div className="flex items-center gap-4">
          {card.bank_domain ? (
            <BankLogo
              bank={SUPPORTED_BANKS.find((b) => b.domain === card.bank_domain) ?? { name: card.name, domain: card.bank_domain }}
              size={52}
            />
          ) : (
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accent}26`, color: accent, width: 52, height: 52 }}
            >
              {card.card_type === "debit_card" ? <Wallet className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold text-text-primary">{cardDisplayLabel(card)}</p>
            <p className="text-sm text-text-secondary">{card.card_type === "debit_card" ? "Banka Kartı" : "Kredi Kartı"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">Bu Ay</p>
            <p className="font-display text-lg font-bold text-text-primary">{formatCurrency(monthlySpent)}</p>
          </div>
        </div>
      </Card>

      <Card>
        {!hasLimit ? (
          <button type="button" onClick={() => setEditOpen(true)} className="flex w-full items-center gap-3 text-left">
            <BellRing className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Limit Belirle</p>
              <p className="text-sm text-text-secondary">Bu kart için aylık harcama limiti koy, yaklaşınca haber verelim</p>
            </div>
          </button>
        ) : (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <BellRing className={`h-4 w-4 ${barColor}`} />
              <span className="text-sm font-semibold text-text-primary">Aylık Limit</span>
              <button type="button" onClick={() => setEditOpen(true)} className="ml-auto text-sm font-medium text-accent hover:underline">
                Düzenle
              </button>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
              <div
                className={isExceeded ? "h-full rounded-full bg-danger" : isWarning ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-success"}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className={`mt-1.5 text-sm font-medium ${barColor}`}>
              {isExceeded
                ? `${formatCurrency(monthlySpent)} — limiti ${formatCurrency(monthlySpent - limit)} aştın`
                : `${formatCurrency(monthlySpent)} / ${formatCurrency(limit)}`}
            </p>
          </div>
        )}
      </Card>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Bu Ay Yapılan Harcamalar</p>
        {expenses.length === 0 ? (
          <Card>
            <EmptyState title="Bu ay bu kartla henüz harcama yok" />
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {expenses.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => router.push(`/expenses/${e.id}`)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">{e.store_name || "Manuel Giriş"}</p>
                  <p className="text-sm text-text-secondary">{e.date}</p>
                </div>
                <span className="shrink-0 font-medium text-text-primary">{formatCurrency(Number(e.total))}</span>
              </button>
            ))}
          </Card>
        )}
      </div>

      <CardFormDialog open={editOpen} onClose={() => setEditOpen(false)} card={card} />
    </div>
  );
}
