"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createHizmetCustomer, updateHizmetCustomer } from "@/lib/data/hizmet";
import type { HizmetCustomerRow } from "@/lib/types/esnaf";

interface FormValues {
  name: string;
  phone: string;
  vehiclePlate: string;
  deviceModel: string;
  notes: string;
}

export function HizmetMusteriDialog({
  open,
  onClose,
  businessId,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customer?: HizmetCustomerRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      vehiclePlate: customer?.vehicle_plate ?? "",
      deviceModel: customer?.device_model ?? "",
      notes: customer?.notes ?? "",
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

      if (customer) {
        await updateHizmetCustomer(supabase, customer.id, {
          name: values.name,
          phone: values.phone || null,
          vehicle_plate: values.vehiclePlate || null,
          device_model: values.deviceModel || null,
          notes: values.notes || null,
        });
      } else {
        await createHizmetCustomer(supabase, {
          businessId,
          userId: user.id,
          name: values.name,
          phone: values.phone || null,
          vehiclePlate: values.vehiclePlate || null,
          deviceModel: values.deviceModel || null,
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
    <Dialog open={open} onClose={onClose} title={customer ? "Müşteriyi Düzenle" : "Müşteri Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="hm-name">Ad Soyad</Label>
          <Input id="hm-name" {...register("name", { required: true })} />
        </div>
        <div>
          <Label htmlFor="hm-phone">Telefon</Label>
          <Input id="hm-phone" {...register("phone")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hm-plate">Plaka (isteğe bağlı)</Label>
            <Input id="hm-plate" placeholder="34 ABC 123" {...register("vehiclePlate")} />
          </div>
          <div>
            <Label htmlFor="hm-device">Cihaz Modeli (isteğe bağlı)</Label>
            <Input id="hm-device" placeholder="iPhone 13" {...register("deviceModel")} />
          </div>
        </div>
        <div>
          <Label htmlFor="hm-notes">Not</Label>
          <Input id="hm-notes" {...register("notes")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : customer ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
