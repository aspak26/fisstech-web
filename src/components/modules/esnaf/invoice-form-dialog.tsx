"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { BusinessRow } from "@/lib/types/esnaf";

interface FormValues {
  counterparty: string;
  invoiceNumber: string;
  amount: number;
  vatRate: number;
  invoiceDate: string;
  dueDate: string;
  notes: string;
}

export function InvoiceFormDialog({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessRow;
}) {
  const router = useRouter();
  const [type, setType] = useState<"giden" | "gelen">("giden");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      counterparty: "",
      invoiceNumber: "",
      amount: 0,
      vatRate: Number(business.default_vat),
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      notes: "",
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

      const vatAmount = (Number(values.amount) * Number(values.vatRate)) / 100;
      const totalWithVat = Number(values.amount) + vatAmount;

      await supabase.from("invoices").insert({
        business_id: business.id,
        user_id: user.id,
        invoice_type: type,
        invoice_number: values.invoiceNumber || null,
        counterparty: values.counterparty || null,
        amount: Number(values.amount),
        vat_rate: Number(values.vatRate),
        vat_amount: vatAmount,
        total_with_vat: totalWithVat,
        status: "bekliyor",
        invoice_date: values.invoiceDate,
        due_date: values.dueDate || null,
        notes: values.notes || null,
      });

      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Fatura Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Tabs
          value={type}
          onChange={(v) => setType(v as "giden" | "gelen")}
          options={[
            { value: "giden", label: "Giden (Kestiğim)" },
            { value: "gelen", label: "Gelen (Aldığım)" },
          ]}
        />
        <div>
          <Label htmlFor="inv-counterparty">Karşı Taraf</Label>
          <Input id="inv-counterparty" {...register("counterparty")} />
        </div>
        <div>
          <Label htmlFor="inv-number">Fatura No (opsiyonel)</Label>
          <Input id="inv-number" {...register("invoiceNumber")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inv-amount">Tutar (KDV hariç)</Label>
            <Input id="inv-amount" type="number" step="0.01" {...register("amount")} />
          </div>
          <div>
            <Label htmlFor="inv-vat">KDV Oranı (%)</Label>
            <Input id="inv-vat" type="number" step="1" {...register("vatRate")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="inv-date">Fatura Tarihi</Label>
            <Input id="inv-date" type="date" {...register("invoiceDate")} />
          </div>
          <div>
            <Label htmlFor="inv-due">Vade Tarihi</Label>
            <Input id="inv-due" type="date" {...register("dueDate")} />
          </div>
        </div>
        <div>
          <Label htmlFor="inv-notes">Not</Label>
          <Input id="inv-notes" {...register("notes")} />
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
