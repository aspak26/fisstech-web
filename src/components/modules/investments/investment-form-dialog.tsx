"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ASSET_TYPES } from "@/lib/investment-asset-types";

interface FormValues {
  assetType: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: string;
  note: string;
}

export function InvestmentFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      assetType: ASSET_TYPES[0].key,
      amount: 0,
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      note: "",
    },
  });
  const assetType = watch("assetType");
  const symbol = ASSET_TYPES.find((a) => a.key === assetType)?.symbol ?? "";

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("investments").insert({
        user_id: user.id,
        asset_type: values.assetType,
        amount: Number(values.amount),
        purchase_price: values.purchasePrice ? Number(values.purchasePrice) : null,
        purchase_date: values.purchaseDate || null,
        note: values.note || null,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Yatırım Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="assetType">Varlık</Label>
          <Select id="assetType" {...register("assetType")}>
            {ASSET_TYPES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.emoji} {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="i-amount">Miktar ({symbol})</Label>
          <Input id="i-amount" type="number" step="0.0001" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="purchasePrice">
            Alış Fiyatı (1 {symbol} için ödenen, opsiyonel)
          </Label>
          <Input id="purchasePrice" type="number" step="0.01" {...register("purchasePrice")} />
        </div>
        <div>
          <Label htmlFor="purchaseDate">Alış Tarihi</Label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>
        <div>
          <Label htmlFor="i-note">Not (opsiyonel)</Label>
          <Input id="i-note" {...register("note")} />
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
