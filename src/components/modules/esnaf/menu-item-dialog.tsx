"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";
import type { MenuCategoryRow } from "@/lib/data/esnaf";

interface FormValues {
  name: string;
  categoryId: string;
  price: number;
  prepMinutes: number;
}

export function MenuItemDialog({
  open,
  onClose,
  business,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
  categories: MenuCategoryRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", categoryId: categories[0]?.id ?? "", price: 0, prepMinutes: 0 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("menu_items").insert({
        business_id: business.id,
        user_id: user.id,
        category_id: values.categoryId || null,
        name: values.name,
        price: Number(values.price),
        prep_minutes: Number(values.prepMinutes),
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Menü Ürünü Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="mi-name">Ürün Adı</Label>
          <Input id="mi-name" {...register("name", { required: true })} />
        </div>
        <div>
          <Label htmlFor="mi-category">Kategori</Label>
          <Select id="mi-category" {...register("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mi-price">Fiyat</Label>
            <Input id="mi-price" type="number" step="0.01" {...register("price")} />
          </div>
          <div>
            <Label htmlFor="mi-prep">Hazırlama (dk, opsiyonel)</Label>
            <Input id="mi-prep" type="number" step="1" {...register("prepMinutes")} />
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
