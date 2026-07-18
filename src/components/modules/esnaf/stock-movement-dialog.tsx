"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { addStockMovement } from "@/lib/data/esnaf";
import type { StockItemRow } from "@/lib/types/esnaf";

export function StockMovementDialog({
  item,
  onClose,
}: {
  item: StockItemRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [type, setType] = useState<"giris" | "cikis" | "sayim">("giris");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ quantity: number; note: string }>({
    defaultValues: { quantity: 0, note: "" },
  });

  async function onSubmit(values: { quantity: number; note: string }) {
    if (!item) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await addStockMovement(supabase, user.id, item, type, Number(values.quantity), values.note);
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!item} onClose={onClose} title={`${item?.name ?? ""} — Stok Hareketi`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Tabs
          value={type}
          onChange={(v) => setType(v as "giris" | "cikis" | "sayim")}
          options={[
            { value: "giris", label: "Giriş" },
            { value: "cikis", label: "Çıkış" },
            { value: "sayim", label: "Sayım" },
          ]}
        />
        <div>
          <Label htmlFor="sm-quantity">
            {type === "sayim" ? "Yeni Miktar" : "Miktar"} ({item?.unit})
          </Label>
          <Input id="sm-quantity" type="number" step="0.001" autoFocus {...register("quantity")} />
        </div>
        <div>
          <Label htmlFor="sm-note">Not (opsiyonel)</Label>
          <Input id="sm-note" {...register("note")} />
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
