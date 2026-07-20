"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createSaleCustomer } from "@/lib/data/satis";

interface FormValues {
  fullName: string;
  phone: string;
  tcOrVat: string;
}

export function SaleMusteriDialog({
  open,
  onClose,
  businessId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { fullName: "", phone: "", tcOrVat: "" },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await createSaleCustomer(supabase, {
        businessId,
        userId: user.id,
        fullName: values.fullName,
        phone: values.phone || null,
        tcOrVat: values.tcOrVat || null,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Müşteri Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="sm-name">Ad Soyad</Label>
          <Input id="sm-name" {...register("fullName", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sm-phone">Telefon</Label>
            <Input id="sm-phone" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="sm-tc">TC / Vergi No</Label>
            <Input id="sm-tc" {...register("tcOrVat")} />
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
