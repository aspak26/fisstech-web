"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createProductVariation,
  createQuickProduct,
  deleteProductVariation,
  updateProductVariation,
  updateQuickProduct,
} from "@/lib/data/perakende";
import type { ProductCategoryRow, ProductVariationRow, QuickProductWithVariations } from "@/lib/types/esnaf";

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
  productCode: string;
}

interface VariationDraft {
  id: string | null;
  label: string;
  price: string;
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
  product?: QuickProductWithVariations;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [hasVariations, setHasVariations] = useState(product?.has_variations ?? false);
  const [variations, setVariations] = useState<VariationDraft[]>(
    (product?.product_variations ?? []).map((v: ProductVariationRow) => ({
      id: v.id,
      label: v.label,
      price: String(v.price),
    })),
  );
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: product?.name ?? "",
      price: product ? Number(product.price) : 0,
      categoryId: product?.category_id ?? categories[0]?.id ?? "",
      unitType: product?.unit_type ?? "adet",
      productCode: product?.product_code ?? "",
    },
  });

  function handleClose() {
    reset();
    setHasVariations(false);
    setVariations([]);
    onClose();
  }

  function addVariationRow() {
    setVariations((prev) => [...prev, { id: null, label: "", price: "" }]);
  }
  function updateVariationRow(index: number, patch: Partial<VariationDraft>) {
    setVariations((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }
  function removeVariationRow(index: number) {
    setVariations((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const validVariations = variations
        .filter((v) => v.label.trim() && Number(v.price) > 0)
        .map((v) => ({ ...v, price: v.price.replace(",", ".") }));

      if (product) {
        await updateQuickProduct(supabase, product.id, {
          name: values.name,
          price: Number(values.price),
          categoryId: values.categoryId || null,
          unitType: values.unitType,
          productCode: values.productCode.trim() || null,
          hasVariations,
        });

        // Mevcut varyasyonları senkronize et — mobildeki gibi sadece
        // oluşturmada değil, düzenlemede de tam CRUD (daha doğru davranış).
        const existingIds = new Set((product.product_variations ?? []).map((v) => v.id));
        const keptIds = new Set(validVariations.filter((v) => v.id).map((v) => v.id as string));
        for (const removedId of existingIds) {
          if (!keptIds.has(removedId)) await deleteProductVariation(supabase, removedId);
        }
        for (const v of validVariations) {
          if (v.id) {
            await updateProductVariation(supabase, v.id, { label: v.label, price: Number(v.price) });
          } else if (hasVariations) {
            await createProductVariation(supabase, {
              productId: product.id,
              businessId,
              userId: user.id,
              label: v.label,
              price: Number(v.price),
            });
          }
        }
      } else {
        await createQuickProduct(supabase, {
          businessId,
          userId: user.id,
          categoryId: values.categoryId || null,
          name: values.name,
          price: Number(values.price),
          unitType: values.unitType,
          productCode: values.productCode.trim() || null,
          hasVariations,
          variations: hasVariations ? validVariations.map((v) => ({ label: v.label, price: Number(v.price) })) : [],
        });
      }
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title={product ? "Ürünü Düzenle" : "Ürün Ekle"}>
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
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="p-code">PLU Kodu (opsiyonel)</Label>
            <Input id="p-code" placeholder="örn. 24" maxLength={6} {...register("productCode")} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-control border border-border p-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Varyasyonlu ürün</p>
            <p className="text-xs text-text-secondary">Kasada boyut/tür seçimi göster (örn. Küçük/Büyük)</p>
          </div>
          <Switch checked={hasVariations} onChange={setHasVariations} />
        </div>

        {hasVariations && (
          <div className="space-y-2 rounded-control border border-border p-3">
            {variations.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Etiket (örn. Büyük)"
                  value={v.label}
                  onChange={(e) => updateVariationRow(i, { label: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  value={v.price}
                  onChange={(e) => updateVariationRow(i, { price: e.target.value })}
                  className="w-28"
                />
                <button
                  type="button"
                  aria-label="Varyasyonu kaldır"
                  onClick={() => removeVariationRow(i)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariationRow}
              className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Varyasyon ekle
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
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
