"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";

interface FormValues {
  name: string;
  unit: string;
  currentQty: number;
  criticalQty: number;
  unitCost: number;
}

export function StockItemFormDialog({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", unit: "adet", currentQty: 0, criticalQty: 0, unitCost: 0 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("stock_items").insert({
        business_id: business.id,
        user_id: user.id,
        name: values.name,
        unit: values.unit,
        current_qty: Number(values.currentQty),
        critical_qty: Number(values.criticalQty),
        unit_cost: values.unitCost ? Number(values.unitCost) : null,
      });

      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Stok Ürünü Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="si-name">Ürün Adı</Label>
          <Input id="si-name" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="si-unit">Birim</Label>
            <Input id="si-unit" placeholder="adet, kg, lt..." {...register("unit")} />
          </div>
          <div>
            <Label htmlFor="si-cost">Birim Maliyet (opsiyonel)</Label>
            <Input id="si-cost" type="number" step="0.01" {...register("unitCost")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="si-current">Mevcut Miktar</Label>
            <Input id="si-current" type="number" step="0.001" {...register("currentQty")} />
          </div>
          <div>
            <Label htmlFor="si-critical">Kritik Seviye</Label>
            <Input id="si-critical" type="number" step="0.001" {...register("criticalQty")} />
          </div>
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
