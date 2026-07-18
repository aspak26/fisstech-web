"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";

export function MenuCategoryDialog({
  open,
  onClose,
  business,
  sortOrder,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
  sortOrder: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ name: string }>({
    defaultValues: { name: "" },
  });

  async function onSubmit(values: { name: string }) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("menu_categories").insert({
        business_id: business.id,
        user_id: user.id,
        name: values.name,
        sort_order: sortOrder,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Menü Kategorisi Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="mc-name">Kategori Adı</Label>
          <Input id="mc-name" placeholder="Sıcak İçecekler, Tatlılar..." {...register("name", { required: true })} />
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
