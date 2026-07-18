"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

interface FormValues {
  name: string;
  amount: number;
  renewalDate: string;
  frequency: string;
}

export function SubscriptionFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      name: "",
      amount: 0,
      renewalDate: new Date().toISOString().slice(0, 10),
      frequency: "monthly",
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
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        name: values.name,
        amount: Number(values.amount),
        renewal_date: values.renewalDate,
        frequency: values.frequency,
        status: "active",
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Abonelik Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="s-name">Servis Adı</Label>
          <Input id="s-name" placeholder="Netflix, Spotify..." {...register("name", { required: true })} />
        </div>
        <div>
          <Label htmlFor="s-amount">Tutar</Label>
          <Input id="s-amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="renewalDate">Yenilenme Tarihi</Label>
          <Input id="renewalDate" type="date" {...register("renewalDate")} />
        </div>
        <div>
          <Label htmlFor="frequency">Sıklık</Label>
          <Select id="frequency" {...register("frequency")}>
            <option value="monthly">Aylık</option>
            <option value="yearly">Yıllık</option>
          </Select>
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
