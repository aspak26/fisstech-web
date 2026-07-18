"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { IncomeCategoriesRow } from "@/lib/types/database";

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Tek seferlik" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
  { value: "yearly", label: "Yıllık" },
];

interface FormValues {
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  recurrence: string;
}

export function IncomeFormDialog({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: IncomeCategoriesRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: "",
      categoryId: categories[0]?.id ?? "",
      recurrence: "none",
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
      await supabase.from("incomes").insert({
        user_id: user.id,
        category_id: values.categoryId || null,
        amount: Number(values.amount),
        date: values.date,
        description: values.description || null,
        recurrence: values.recurrence,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Gelir Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="amount">Tutar</Label>
          <Input id="amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="date">Tarih</Label>
          <Input id="date" type="date" {...register("date")} />
        </div>
        <div>
          <Label htmlFor="categoryId">Kategori</Label>
          <Select id="categoryId" {...register("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="recurrence">Tekrar</Label>
          <Select id="recurrence" {...register("recurrence")}>
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Açıklama (opsiyonel)</Label>
          <Input id="description" {...register("description")} />
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
