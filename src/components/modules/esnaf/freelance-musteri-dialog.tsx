"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createFreelanceClient, updateFreelanceClient } from "@/lib/data/freelance";
import type { FreelanceClientRow } from "@/lib/types/esnaf";

interface FormValues {
  name: string;
  companyName: string;
  phone: string;
  email: string;
  taxId: string;
}

export function FreelanceMusteriDialog({
  open,
  onClose,
  businessId,
  client,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  client?: FreelanceClientRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      name: client?.name ?? "",
      companyName: client?.company_name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      taxId: client?.tax_id ?? "",
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

      if (client) {
        await updateFreelanceClient(supabase, client.id, {
          name: values.name,
          company_name: values.companyName || null,
          phone: values.phone || null,
          email: values.email || null,
          tax_id: values.taxId || null,
        });
      } else {
        await createFreelanceClient(supabase, {
          businessId,
          userId: user.id,
          name: values.name,
          companyName: values.companyName || null,
          phone: values.phone || null,
          email: values.email || null,
          taxId: values.taxId || null,
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
    <Dialog open={open} onClose={onClose} title={client ? "Müşteriyi Düzenle" : "Müşteri Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fm-name">Ad Soyad</Label>
          <Input id="fm-name" {...register("name", { required: true })} />
        </div>
        <div>
          <Label htmlFor="fm-company">Firma (isteğe bağlı)</Label>
          <Input id="fm-company" {...register("companyName")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fm-phone">Telefon</Label>
            <Input id="fm-phone" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="fm-email">E-posta</Label>
            <Input id="fm-email" type="email" {...register("email")} />
          </div>
        </div>
        <div>
          <Label htmlFor="fm-tax">Vergi No (isteğe bağlı)</Label>
          <Input id="fm-tax" {...register("taxId")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : client ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
