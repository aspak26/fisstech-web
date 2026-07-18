"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { FixedExpenseCategoriesRow } from "@/lib/types/database";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Havale/EFT" },
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
  { value: "auto_payment", label: "Otomatik Ödeme" },
];

const RECURRENCE_OPTIONS = [
  { value: "monthly", label: "Aylık" },
  { value: "weekly", label: "Haftalık" },
  { value: "yearly", label: "Yıllık" },
  { value: "once", label: "Tek seferlik" },
];

interface FormValues {
  amount: number;
  paymentDay: number;
  description: string;
  categoryId: string;
  paymentMethod: string;
  recurrence: string;
}

export function FixedExpenseFormDialog({
  open,
  onClose,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: FixedExpenseCategoriesRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      amount: 0,
      paymentDay: 1,
      description: "",
      categoryId: categories[0]?.id ?? "",
      paymentMethod: "bank_transfer",
      recurrence: "monthly",
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
      await supabase.from("fixed_expenses").insert({
        user_id: user.id,
        category_id: values.categoryId || null,
        amount: Number(values.amount),
        payment_day: Number(values.paymentDay),
        description: values.description || null,
        payment_method: values.paymentMethod,
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
    <Dialog open={open} onClose={onClose} title="Sabit Gider Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="fe-amount">Tutar</Label>
          <Input id="fe-amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="paymentDay">Ödeme Günü (ayın kaçı)</Label>
          <Input id="paymentDay" type="number" min={1} max={31} {...register("paymentDay")} />
        </div>
        <div>
          <Label htmlFor="fe-categoryId">Kategori</Label>
          <Select id="fe-categoryId" {...register("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="paymentMethod">Ödeme Yöntemi</Label>
          <Select id="paymentMethod" {...register("paymentMethod")}>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fe-recurrence">Tekrar</Label>
          <Select id="fe-recurrence" {...register("recurrence")}>
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="fe-description">Açıklama (opsiyonel)</Label>
          <Input id="fe-description" {...register("description")} />
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
