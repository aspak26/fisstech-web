"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { addCard, updateCard } from "@/lib/data/cards";
import { SUPPORTED_BANKS } from "@/lib/data/banks";
import { BankLogo } from "./bank-logo";
import { Landmark } from "lucide-react";
import type { CardsRow } from "@/lib/types/database";

// Mobildeki kCardColorPalette (add_card_screen.dart) ile birebir aynı 10
// renk — kartları görsel olarak ayırt etmek için.
const COLOR_PALETTE = [
  0xff2e7d32, 0xff1565c0, 0xffc62828, 0xffef6c00, 0xff6a1b9a, 0xff00838f, 0xffad1457, 0xff37474f, 0xfff9a825, 0xff4527a0,
];

function colorToHex(argb: number): string {
  return `#${(argb & 0xffffff).toString(16).padStart(6, "0")}`;
}

interface FormValues {
  name: string;
  last4: string;
  limitAmount: string;
}

export function CardFormDialog({
  open,
  onClose,
  card,
}: {
  open: boolean;
  onClose: () => void;
  card?: CardsRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardType, setCardType] = useState<"credit_card" | "debit_card">(card?.card_type ?? "credit_card");
  const [bankDomain, setBankDomain] = useState<string | null>(card?.bank_domain ?? null);
  const [color, setColor] = useState<number>(card?.color ?? COLOR_PALETTE[0]);
  const selectedBank = bankDomain ? SUPPORTED_BANKS.find((b) => b.domain === bankDomain) : undefined;
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: card?.name ?? "",
      last4: card?.last4 ?? "",
      limitAmount: card?.limit_amount ? String(card.limit_amount) : "",
    },
  });

  function handleClose() {
    reset();
    setError(null);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const name = values.name.trim();
    const last4 = values.last4.trim();
    if (!name) {
      setError("Kart adı gerekli.");
      return;
    }
    if (!/^\d{4}$/.test(last4)) {
      setError("Son 4 hane 4 rakam olmalı.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const limitAmount = values.limitAmount.trim() ? Number(values.limitAmount.replace(",", ".")) : null;

      if (card) {
        await updateCard(supabase, card.id, { name, last4, cardType, bankDomain, limitAmount, color });
      } else {
        await addCard(supabase, user.id, { name, last4, cardType, bankDomain, limitAmount, color });
      }
      handleClose();
      router.refresh();
    } catch {
      setError("Kaydedilemedi, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title={card ? "Kartı Düzenle" : "Kart Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Kart Tipi</Label>
          <div className="flex gap-2">
            {(
              [
                { value: "credit_card", label: "Kredi Kartı" },
                { value: "debit_card", label: "Banka Kartı" },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setCardType(t.value)}
                className={cn(
                  "rounded-control border px-3 py-1.5 text-sm font-medium",
                  cardType === t.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-secondary hover:border-accent",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Banka (isteğe bağlı)</Label>
          <div className="flex items-center gap-3">
            {selectedBank ? (
              <BankLogo bank={selectedBank} size={36} />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-text-secondary">
                <Landmark className="h-4 w-4" />
              </div>
            )}
            <Select
              value={bankDomain ?? ""}
              onChange={(e) => setBankDomain(e.target.value || null)}
              className="flex-1"
            >
              <option value="">Banka seçilmedi</option>
              {SUPPORTED_BANKS.map((b) => (
                <option key={b.domain} value={b.domain}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Kart Rengi</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-label="Renk seç"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-text-primary" : "border-transparent",
                )}
                style={{ backgroundColor: colorToHex(c) }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="card-form-name">Kart Adı</Label>
            <Input id="card-form-name" placeholder="örn. Garanti" {...register("name", { required: true })} autoFocus />
          </div>
          <div>
            <Label htmlFor="card-form-last4">Son 4 Hane</Label>
            <Input id="card-form-last4" placeholder="1234" maxLength={4} {...register("last4", { required: true })} />
          </div>
        </div>

        <div>
          <Label htmlFor="card-form-limit">Aylık Limit (isteğe bağlı)</Label>
          <Input id="card-form-limit" type="number" step="0.01" placeholder="₺" {...register("limitAmount")} />
          <p className="mt-1 text-xs text-text-secondary">
            Limit belirlersen, harcamaların %80&apos;ine ulaştığında ve aştığında bildirim alırsın.
          </p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : card ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
