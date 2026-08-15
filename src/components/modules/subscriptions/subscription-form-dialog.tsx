"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { cardDisplayLabel } from "@/lib/data/cards";
import { CardPickerField } from "@/components/modules/cards/card-picker-field";
import type { CardsRow, SubscriptionsRow } from "@/lib/types/database";

const PAYMENT_METHODS = [
  { value: "", label: "Belirtme", emoji: "—" },
  { value: "credit_card", label: "Kredi Kartı", emoji: "💳" },
  { value: "debit_card", label: "Banka Kartı", emoji: "🏦" },
  { value: "cash", label: "Nakit", emoji: "💵" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "paused", label: "Duraklatıldı" },
  { value: "cancelled", label: "İptal Edildi" },
];

interface FormValues {
  name: string;
  amount: number;
  startDate: string;
  renewalDate: string;
  endDate: string;
  status: string;
}

export function SubscriptionFormDialog({
  open,
  onClose,
  subscription,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  subscription?: SubscriptionsRow;
  cards: CardsRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [frequency, setFrequency] = useState<"monthly" | "yearly">(subscription?.frequency ?? "monthly");
  const [paymentMethod, setPaymentMethod] = useState(subscription?.payment_method ?? "");
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(subscription?.is_notify_enabled ?? true);
  const [selectedCardId, setSelectedCardId] = useState(subscription?.card_id ?? "");
  const [extraCards, setExtraCards] = useState<CardsRow[]>([]);
  const allCards = useMemo(() => [...cards, ...extraCards], [cards, extraCards]);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    values: {
      name: subscription?.name ?? "",
      amount: subscription ? Number(subscription.amount) : 0,
      startDate: subscription?.start_date ?? "",
      renewalDate: subscription?.renewal_date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      endDate: subscription?.end_date ?? "",
      status: subscription?.status ?? "active",
    },
  });
  const amount = Number(watch("amount")) || 0;
  const showCardLabel = paymentMethod === "credit_card" || paymentMethod === "debit_card";

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const selectedCard = showCardLabel ? allCards.find((c) => c.id === selectedCardId) : undefined;

      const payload = {
        name: values.name,
        amount: Number(values.amount),
        frequency,
        start_date: values.startDate || null,
        renewal_date: values.renewalDate,
        end_date: values.endDate || null,
        payment_method: paymentMethod || null,
        card_label: selectedCard ? cardDisplayLabel(selectedCard) : null,
        card_id: selectedCard?.id ?? null,
        status: values.status,
        is_notify_enabled: isNotifyEnabled,
      };

      if (subscription) {
        await supabase.from("subscriptions").update(payload).eq("id", subscription.id);
      } else {
        await supabase.from("subscriptions").insert({ user_id: user.id, ...payload });
      }
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={subscription ? "Aboneliği Düzenle" : "Abonelik Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="s-name">Abonelik Adı</Label>
          <Input id="s-name" placeholder="örn. Netflix, Spotify" {...register("name", { required: true })} />
        </div>

        <div>
          <Label htmlFor="s-amount">Tutar (₺)</Label>
          <Input id="s-amount" type="number" step="0.01" {...register("amount", { required: true, min: 0.01 })} />
          {amount > 0 && (
            <p className="mt-1 text-xs text-text-secondary">
              {frequency === "monthly"
                ? `Yıllık: ${formatCurrency(amount * 12)}`
                : `Aylık: ${formatCurrency(amount / 12)}`}
            </p>
          )}
        </div>

        <div>
          <Label>Periyot</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["monthly", "yearly"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={cn(
                  "rounded-control border px-3 py-2.5 text-sm font-medium transition-colors",
                  frequency === f ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                )}
              >
                {f === "monthly" ? "Aylık" : "Yıllık"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startDate">Başlangıç Tarihi (isteğe bağlı)</Label>
            <Input id="startDate" type="date" {...register("startDate")} />
          </div>
          <div>
            <Label htmlFor="renewalDate">Sonraki Yenileme Tarihi</Label>
            <Input id="renewalDate" type="date" {...register("renewalDate", { required: true })} />
          </div>
          <div>
            <Label htmlFor="endDate">Bitiş Tarihi (isteğe bağlı)</Label>
            <Input id="endDate" type="date" {...register("endDate")} />
          </div>
          <div>
            <Label htmlFor="status">Durum</Label>
            <Select id="status" {...register("status")}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Ödeme Yöntemi (isteğe bağlı)</Label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setPaymentMethod(pm.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  paymentMethod === pm.value
                    ? "border-accent bg-accent text-on-accent"
                    : "border-border text-text-secondary hover:border-accent",
                )}
              >
                {pm.emoji} {pm.label}
              </button>
            ))}
          </div>
          {showCardLabel && (
            <div className="mt-2">
              <CardPickerField
                cards={allCards}
                cardType={paymentMethod as "credit_card" | "debit_card"}
                value={selectedCardId}
                onChange={setSelectedCardId}
                onCardCreated={(card) => setExtraCards((prev) => [...prev, card])}
              />
            </div>
          )}
        </div>

        <div className="rounded-control border border-border p-3">
          <Switch
            checked={isNotifyEnabled}
            onChange={setIsNotifyEnabled}
            label="Hatırlatmaları Aç"
            description="Yenileme tarihinden 3 gün önce"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
