"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createSalePortfolio, updateSalePortfolio } from "@/lib/data/satis";
import { PORTFOLIO_CATEGORIES, type SalePortfolioRow, type PortfolioCategory } from "@/lib/types/esnaf";

interface FormValues {
  title: string;
  category: PortfolioCategory;
  description: string;
  listPrice: number;
  costPrice: number;
  notes: string;
}

export function PortfolioDialog({
  open,
  onClose,
  businessId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  item?: SalePortfolioRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      title: item?.title ?? "",
      category: item?.category ?? "diger",
      description: item?.description ?? "",
      listPrice: item ? Number(item.list_price) : 0,
      costPrice: item?.cost_price ? Number(item.cost_price) : 0,
      notes: item?.notes ?? "",
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
        await updateSalePortfolio(supabase, item.id, {
          title: values.title,
          category: values.category,
          description: values.description || null,
          listPrice: Number(values.listPrice),
          costPrice: values.costPrice ? Number(values.costPrice) : null,
          notes: values.notes || null,
        });
      } else {
        await createSalePortfolio(supabase, {
          businessId,
          userId: user.id,
          title: values.title,
          category: values.category,
          description: values.description || null,
          listPrice: Number(values.listPrice),
          costPrice: values.costPrice ? Number(values.costPrice) : null,
          notes: values.notes || null,
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
    <Dialog open={open} onClose={onClose} title={item ? "Portföyü Düzenle" : "Portföye Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="pf-title">Başlık</Label>
          <Input id="pf-title" {...register("title", { required: true })} />
        </div>
        <div>
          <Label htmlFor="pf-category">Kategori</Label>
          <Select id="pf-category" {...register("category")}>
            {PORTFOLIO_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pf-desc">Açıklama (isteğe bağlı)</Label>
          <Input id="pf-desc" {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pf-list-price">Liste Fiyatı</Label>
            <Input id="pf-list-price" type="number" step="0.01" {...register("listPrice", { required: true, min: 0 })} />
          </div>
          <div>
            <Label htmlFor="pf-cost-price">Maliyet (isteğe bağlı)</Label>
            <Input id="pf-cost-price" type="number" step="0.01" {...register("costPrice")} />
          </div>
        </div>
        <div>
          <Label htmlFor="pf-notes">Not (isteğe bağlı)</Label>
          <Input id="pf-notes" {...register("notes")} />
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
