"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";

interface FormValues {
  personName: string;
  amount: number;
  date: string;
  dueDate: string;
  note: string;
}

export function DebtFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [type, setType] = useState<"borrowed" | "lent">("borrowed");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      personName: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      note: "",
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
      await supabase.from("user_debts").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        type,
        person_name: values.personName,
        amount: Number(values.amount),
        date: values.date,
        due_date: values.dueDate || null,
        note: values.note,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Borç/Alacak Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Tabs
          value={type}
          onChange={(v) => setType(v as "borrowed" | "lent")}
          options={[
            { value: "borrowed", label: "Borç Aldım" },
            { value: "lent", label: "Borç Verdim" },
          ]}
        />
        <div>
          <Label htmlFor="personName">Kişi</Label>
          <Input id="personName" {...register("personName", { required: true })} />
        </div>
        <div>
          <Label htmlFor="d-amount">Tutar</Label>
          <Input id="d-amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="d-date">Tarih</Label>
            <Input id="d-date" type="date" {...register("date")} />
          </div>
          <div>
            <Label htmlFor="dueDate">Vade (opsiyonel)</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>
        </div>
        <div>
          <Label htmlFor="d-note">Not</Label>
          <Input id="d-note" {...register("note")} />
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
