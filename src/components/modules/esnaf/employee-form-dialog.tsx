"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";

interface FormValues {
  fullName: string;
  role: string;
  phone: string;
  salary: number;
  salaryDay: number;
}

export function EmployeeFormDialog({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { fullName: "", role: "", phone: "", salary: 0, salaryDay: 1 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("employees").insert({
        business_id: business.id,
        user_id: user.id,
        full_name: values.fullName,
        role: values.role || null,
        phone: values.phone || null,
        salary: Number(values.salary),
        salary_day: Number(values.salaryDay),
        start_date: new Date().toISOString().slice(0, 10),
      });

      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Personel Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="emp-name">Ad Soyad</Label>
          <Input id="emp-name" {...register("fullName", { required: true })} />
        </div>
        <div>
          <Label htmlFor="emp-role">Görev (opsiyonel)</Label>
          <Input id="emp-role" {...register("role")} />
        </div>
        <div>
          <Label htmlFor="emp-phone">Telefon (opsiyonel)</Label>
          <Input id="emp-phone" {...register("phone")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emp-salary">Maaş</Label>
            <Input id="emp-salary" type="number" step="0.01" {...register("salary")} />
          </div>
          <div>
            <Label htmlFor="emp-salaryDay">Maaş Günü</Label>
            <Input id="emp-salaryDay" type="number" min={1} max={31} {...register("salaryDay")} />
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
