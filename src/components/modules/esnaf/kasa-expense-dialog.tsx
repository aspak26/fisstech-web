"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { BusinessRow } from "@/lib/types/esnaf";

const CATEGORIES = ["genel", "kira", "fatura", "malzeme", "personel", "diger"];
const PAYMENT_METHODS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
];

interface FormValues {
  amount: number;
  category: string;
  description: string;
  paymentMethod: string;
  date: string;
}

export function KasaExpenseDialog({
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
    defaultValues: {
      amount: 0,
      category: "genel",
      description: "",
      paymentMethod: "cash",
      date: new Date().toISOString().slice(0, 10),
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

      const rate = business.vat_enabled ? Number(business.default_vat) : 0;
      const vatAmount = rate > 0 ? (Number(values.amount) * rate) / (100 + rate) : 0;

      await supabase.from("business_expenses").insert({
        business_id: business.id,
        user_id: user.id,
        amount: Number(values.amount),
        category: values.category,
        description: values.description || null,
        payment_method: values.paymentMethod,
        vat_rate: rate,
        vat_amount: vatAmount,
        expense_date: values.date,
      });

      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Gider Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="ke-amount">Tutar (KDV dahil)</Label>
          <Input id="ke-amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="ke-category">Kategori</Label>
          <Select id="ke-category" {...register("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ke-desc">Açıklama</Label>
          <Input id="ke-desc" {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ke-payment">Ödeme</Label>
            <Select id="ke-payment" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ke-date">Tarih</Label>
            <Input id="ke-date" type="date" {...register("date")} />
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
