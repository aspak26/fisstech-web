"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { BUSINESS_SECTORS, businessTypeForSector } from "@/lib/types/esnaf";
import { setActiveBusinessId } from "@/lib/esnaf/active-business";

interface FormValues {
  name: string;
  taxId: string;
  phone: string;
  address: string;
  defaultVat: number;
}

export function BusinessSetupForm() {
  const router = useRouter();
  const [sectorKey, setSectorKey] = useState<(typeof BUSINESS_SECTORS)[number]["key"]>(
    BUSINESS_SECTORS[0].key,
  );
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", taxId: "", phone: "", address: "", defaultVat: 20 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: values.name,
          sector: sectorKey,
          business_type: businessTypeForSector(sectorKey),
          tax_id: values.taxId || null,
          phone: values.phone || null,
          address: values.address || null,
          default_vat: Number(values.defaultVat),
        })
        .select("id")
        .single();

      if (error || !data) return;

      await setActiveBusinessId(data.id as string);
      router.push("/esnaf/pano");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-text-primary">
        İşletmeni Kur
      </h1>
      <p className="mb-6 text-sm text-text-secondary">
        Esnaf Modu&apos;nu kullanmak için önce işletmeni tanımla.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label>Sektör</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BUSINESS_SECTORS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSectorKey(s.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-control border border-border bg-bg p-3 text-center text-xs",
                  sectorKey === s.key && "border-accent bg-accent/5 text-accent",
                )}
              >
                <s.icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            {BUSINESS_SECTORS.find((s) => s.key === sectorKey)?.desc}
          </p>
        </div>

        <div>
          <Label htmlFor="biz-name">İşletme Adı</Label>
          <Input id="biz-name" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="taxId">Vergi No (opsiyonel)</Label>
            <Input id="taxId" {...register("taxId")} />
          </div>
          <div>
            <Label htmlFor="phone">Telefon (opsiyonel)</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>
        <div>
          <Label htmlFor="biz-address">Adres (opsiyonel)</Label>
          <textarea
            id="biz-address"
            rows={3}
            placeholder="Mahalle, sokak, il..."
            className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("address")}
          />
        </div>
        <div>
          <Label htmlFor="defaultVat">Varsayılan KDV Oranı (%)</Label>
          <Input id="defaultVat" type="number" step="1" {...register("defaultVat")} />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Oluşturuluyor…" : "İşletmeyi Oluştur"}
        </Button>
      </form>
    </Card>
  );
}
