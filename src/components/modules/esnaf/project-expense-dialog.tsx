"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { addProjectExpense } from "@/lib/data/freelance";

const CATEGORIES = ["Yol", "Yemek", "Yazılım", "Malzeme", "Diğer"];

interface FormValues {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
}

export function ProjectExpenseDialog({
  open,
  onClose,
  businessId,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { category: "Diğer", description: "", amount: 0, expenseDate: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await addProjectExpense(supabase, {
        businessId,
        userId: user.id,
        projectId,
        category: values.category,
        description: values.description || null,
        amount: Number(values.amount),
        expenseDate: values.expenseDate,
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Masraf Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="pe-category">Kategori</Label>
          <Select id="pe-category" {...register("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pe-desc">Açıklama (isteğe bağlı)</Label>
          <Input id="pe-desc" {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pe-amount">Tutar</Label>
            <Input id="pe-amount" type="number" step="0.01" {...register("amount", { required: true, min: 0.01 })} />
          </div>
          <div>
            <Label htmlFor="pe-date">Tarih</Label>
            <Input id="pe-date" type="date" {...register("expenseDate")} />
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
