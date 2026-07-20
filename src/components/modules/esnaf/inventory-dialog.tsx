"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createInventoryItem, updateInventoryItem } from "@/lib/data/toptan";
import type { InventoryRow } from "@/lib/types/esnaf";

const UNIT_TYPES = ["adet", "koli", "palet", "çuval", "ton", "kg", "lt"];

interface FormValues {
  name: string;
  category: string;
  unitType: string;
  currentStock: number;
  criticalLevel: number;
  costPrice: number;
  sellingPrice: number;
}

export function InventoryDialog({
  open,
  onClose,
  businessId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  item?: InventoryRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: item?.name ?? "",
      category: item?.category ?? "",
      unitType: item?.unit_type ?? "adet",
      currentStock: item ? Number(item.current_stock) : 0,
      criticalLevel: item ? Number(item.critical_level) : 0,
      costPrice: item ? Number(item.cost_price) : 0,
      sellingPrice: item ? Number(item.selling_price) : 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (item) {
        await updateInventoryItem(supabase, item.id, {
          name: values.name,
          category: values.category || null,
          unitType: values.unitType,
          criticalLevel: Number(values.criticalLevel),
          costPrice: Number(values.costPrice),
          sellingPrice: Number(values.sellingPrice),
        });
      } else {
        await createInventoryItem(supabase, {
          businessId,
          userId: user.id,
          name: values.name,
          category: values.category || null,
          unitType: values.unitType,
          currentStock: Number(values.currentStock),
          criticalLevel: Number(values.criticalLevel),
          costPrice: Number(values.costPrice),
          sellingPrice: Number(values.sellingPrice),
        });
      }
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={item ? "Ürünü Düzenle" : "Depo Kaydı Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="inv-name">Ürün Adı</Label>
          <Input id="inv-name" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inv-category">Kategori (isteğe bağlı)</Label>
            <Input id="inv-category" {...register("category")} />
          </div>
          <div>
            <Label htmlFor="inv-unit">Birim</Label>
            <Select id="inv-unit" {...register("unitType")}>
              {UNIT_TYPES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {!item && (
          <div>
            <Label htmlFor="inv-stock">Başlangıç Stoğu</Label>
            <Input id="inv-stock" type="number" step="0.001" {...register("currentStock")} />
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="inv-critical">Kritik Seviye</Label>
            <Input id="inv-critical" type="number" step="0.001" {...register("criticalLevel")} />
          </div>
          <div>
            <Label htmlFor="inv-cost">Maliyet</Label>
            <Input id="inv-cost" type="number" step="0.01" {...register("costPrice")} />
          </div>
          <div>
            <Label htmlFor="inv-price">Satış Fiyatı</Label>
            <Input id="inv-price" type="number" step="0.01" {...register("sellingPrice")} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : item ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
