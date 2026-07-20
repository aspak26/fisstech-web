"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createB2bCustomer, updateB2bCustomer } from "@/lib/data/toptan";
import type { B2bCustomerRow, RiskLevel } from "@/lib/types/esnaf";

const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
  { value: "low", label: "Düşük" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksek" },
];

interface FormValues {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  creditLimit: number;
  riskLevel: RiskLevel;
}

export function B2bCustomerDialog({
  open,
  onClose,
  businessId,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customer?: B2bCustomerRow;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      companyName: customer?.company_name ?? "",
      contactName: customer?.contact_name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
      taxId: customer?.tax_id ?? "",
      creditLimit: customer ? Number(customer.credit_limit) : 0,
      riskLevel: customer?.risk_level ?? "low",
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

      if (customer) {
        await updateB2bCustomer(supabase, customer.id, {
          companyName: values.companyName,
          contactName: values.contactName || null,
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          taxId: values.taxId || null,
          creditLimit: Number(values.creditLimit),
          riskLevel: values.riskLevel,
        });
      } else {
        await createB2bCustomer(supabase, {
          businessId,
          userId: user.id,
          companyName: values.companyName,
          contactName: values.contactName || null,
          phone: values.phone || null,
          email: values.email || null,
          address: values.address || null,
          taxId: values.taxId || null,
          creditLimit: Number(values.creditLimit),
          riskLevel: values.riskLevel,
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
    <Dialog open={open} onClose={onClose} title={customer ? "Bayiyi Düzenle" : "Bayi Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="b2b-company">Firma Adı</Label>
          <Input id="b2b-company" {...register("companyName", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="b2b-contact">Yetkili Adı</Label>
            <Input id="b2b-contact" {...register("contactName")} />
          </div>
          <div>
            <Label htmlFor="b2b-phone">Telefon</Label>
            <Input id="b2b-phone" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="b2b-email">E-posta</Label>
            <Input id="b2b-email" type="email" {...register("email")} />
          </div>
          <div>
            <Label htmlFor="b2b-tax">Vergi No</Label>
            <Input id="b2b-tax" {...register("taxId")} />
          </div>
        </div>
        <div>
          <Label htmlFor="b2b-address">Adres</Label>
          <Input id="b2b-address" {...register("address")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="b2b-limit">Kredi Limiti</Label>
            <Input id="b2b-limit" type="number" step="0.01" {...register("creditLimit")} />
          </div>
          <div>
            <Label htmlFor="b2b-risk">Risk Seviyesi</Label>
            <Select id="b2b-risk" {...register("riskLevel")}>
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : customer ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
