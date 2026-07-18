"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { BusinessRow, BusinessServiceChipRow } from "@/lib/types/esnaf";

const PAYMENT_METHODS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
];

interface FormValues {
  amount: number;
  description: string;
  paymentMethod: string;
  date: string;
}

export function KasaIncomeDialog({
  open,
  onClose,
  business,
  chips,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
  chips: BusinessServiceChipRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedChip, setSelectedChip] = useState<BusinessServiceChipRow | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      amount: 0,
      description: "",
      paymentMethod: "cash",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  function pickChip(chip: BusinessServiceChipRow) {
    setSelectedChip(chip);
    setValue("amount", chip.price);
  }

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

      await supabase.from("business_incomes").insert({
        business_id: business.id,
        user_id: user.id,
        amount: Number(values.amount),
        description: values.description || null,
        payment_method: values.paymentMethod,
        vat_rate: rate,
        vat_amount: vatAmount,
        chip_id: selectedChip?.id ?? null,
        chip_label: selectedChip?.label ?? null,
        transaction_date: values.date,
      });

      reset();
      setSelectedChip(null);
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Gelir Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {chips.length > 0 && (
          <div>
            <Label>Hızlı Seçim</Label>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => pickChip(chip)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    selectedChip?.id === chip.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-text-primary"
                  }`}
                >
                  {chip.label} · {chip.price}₺
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <Label htmlFor="ki-amount">Tutar (KDV dahil)</Label>
          <Input id="ki-amount" type="number" step="0.01" {...register("amount")} />
        </div>
        <div>
          <Label htmlFor="ki-desc">Açıklama</Label>
          <Input id="ki-desc" {...register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ki-payment">Ödeme</Label>
            <Select id="ki-payment" {...register("paymentMethod")}>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ki-date">Tarih</Label>
            <Input id="ki-date" type="date" {...register("date")} />
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
