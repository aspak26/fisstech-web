"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { addCard } from "@/lib/data/cards";
import type { CardsRow } from "@/lib/types/database";

interface FormValues {
  name: string;
  last4: string;
}

/** Ported from mobile's CardPickerSheet "Yeni Kart Ekle" — rendered inline
 * (not as a nested Dialog) to avoid two overlapping focus traps, same
 * reasoning as expenses/category-add-dialog.tsx's CategoryAddInline. */
export function CardAddInline({
  cardType,
  onCreated,
  onCancel,
}: {
  cardType: "credit_card" | "debit_card";
  onCreated: (card: CardsRow) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", last4: "" },
  });

  async function onSubmit(values: FormValues) {
    const name = values.name.trim();
    const last4 = values.last4.trim();
    if (!name || !/^\d{4}$/.test(last4)) {
      setError("Kart adı ve 4 haneli son hane gerekli.");
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
      const card = await addCard(supabase, user.id, { name, last4, cardType });
      onCreated(card);
    } catch {
      setError("Eklenemedi, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 rounded-control border border-border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="card-name" className="text-xs">
            Kart Adı
          </Label>
          <Input id="card-name" className="h-9" placeholder="örn. Garanti" {...register("name", { required: true })} autoFocus />
        </div>
        <div>
          <Label htmlFor="card-last4" className="text-xs">
            Son 4 Hane
          </Label>
          <Input id="card-last4" className="h-9" placeholder="1234" maxLength={4} {...register("last4", { required: true })} />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Ekleniyor…" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
