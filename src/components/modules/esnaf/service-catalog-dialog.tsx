"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createServiceCatalogItem, updateServiceCatalogItem } from "@/lib/data/hizmet";
import type { ServiceCatalogRow } from "@/lib/types/esnaf";

interface FormValues {
  name: string;
  defaultPrice: number;
  durationMinutes: number;
}

export function ServiceCatalogDialog({
  open,
  onClose,
  businessId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  item?: ServiceCatalogRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: item?.name ?? "",
      defaultPrice: item ? Number(item.default_price) : 0,
      durationMinutes: item?.duration_minutes ?? 30,
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
        await updateServiceCatalogItem(supabase, item.id, {
          name: values.name,
          defaultPrice: Number(values.defaultPrice),
          durationMinutes: Number(values.durationMinutes),
        });
      } else {
        await createServiceCatalogItem(supabase, {
          businessId,
          userId: user.id,
          name: values.name,
          defaultPrice: Number(values.defaultPrice),
          durationMinutes: Number(values.durationMinutes),
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
    <Dialog open={open} onClose={onClose} title={item ? "Hizmeti Düzenle" : "Hizmet Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="sc-name">Hizmet Adı</Label>
          <Input id="sc-name" placeholder="örn. Yağ Değişimi" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sc-price">Varsayılan Fiyat</Label>
            <Input id="sc-price" type="number" step="0.01" {...register("defaultPrice", { required: true, min: 0 })} />
          </div>
          <div>
            <Label htmlFor="sc-duration">Süre (dk)</Label>
            <Input id="sc-duration" type="number" step="5" {...register("durationMinutes", { required: true, min: 5 })} />
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
