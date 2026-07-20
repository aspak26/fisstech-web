"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createQuickProduct, updateQuickProduct } from "@/lib/data/perakende";
import type { ProductCategoryRow, QuickProductRow } from "@/lib/types/esnaf";

const UNIT_TYPES = [
  { value: "adet", label: "Adet" },
  { value: "gram", label: "Gram" },
  { value: "kg", label: "Kilogram" },
  { value: "litre", label: "Litre" },
];

interface FormValues {
  name: string;
  price: number;
  categoryId: string;
  unitType: string;
}

export function PerakendeProductDialog({
  open,
  onClose,
  businessId,
  categories,
  product,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  categories: ProductCategoryRow[];
  product?: QuickProductRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: product?.name ?? "",
      price: product ? Number(product.price) : 0,
      categoryId: product?.category_id ?? categories[0]?.id ?? "",
      unitType: product?.unit_type ?? "adet",
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

      if (product) {
        await updateQuickProduct(supabase, product.id, {
          name: values.name,
          price: Number(values.price),
          categoryId: values.categoryId || null,
          unitType: values.unitType,
        });
      } else {
        await createQuickProduct(supabase, {
          businessId,
          userId: user.id,
          categoryId: values.categoryId || null,
          name: values.name,
          price: Number(values.price),
          unitType: values.unitType,
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
    <Dialog open={open} onClose={onClose} title={product ? "Ürünü Düzenle" : "Ürün Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="p-name">Ürün Adı</Label>
          <Input id="p-name" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="p-price">Fiyat</Label>
            <Input id="p-price" type="number" step="0.01" {...register("price", { required: true, min: 0 })} />
          </div>
          <div>
            <Label htmlFor="p-unit">Birim</Label>
            <Select id="p-unit" {...register("unitType")}>
              {UNIT_TYPES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {categories.length > 0 && (
          <div>
            <Label htmlFor="p-category">Kategori</Label>
            <Select id="p-category" {...register("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : product ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
