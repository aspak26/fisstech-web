"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import type { CategoryOption } from "@/lib/scan/types";
import type { ScanResult, ScanResultItem } from "@/lib/scan/types";
import { totalVat } from "@/lib/scan/types";

const PAYMENT_METHODS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
  { value: "unknown", label: "Bilinmiyor" },
];

interface FormValues {
  storeName: string;
  date: string;
  total: number;
  paymentMethod: string;
  items: {
    name: string;
    category: string;
    price: number;
    quantity: number;
    unit: string;
    vatRate: number;
  }[];
}

export function ReceiptReviewForm({
  result,
  categories,
  saving,
  onCancel,
  onConfirm,
}: {
  result: ScanResult;
  categories: CategoryOption[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: (edited: ScanResult) => void;
}) {
  const { register, control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      storeName: result.storeName,
      date: result.date,
      total: result.total,
      paymentMethod: result.paymentMethod,
      items: result.items,
    },
  });
  const { fields, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  const categoryNames = [...new Set(categories.map((c) => c.name))];

  const liveTotalVat = totalVat(
    (watchedItems ?? []).map(
      (item): ScanResultItem => ({
        name: item.name ?? "",
        category: item.category ?? "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        unit: item.unit ?? "adet",
        vatRate: Number(item.vatRate) || 0,
      }),
    ),
  );

  function submit(values: FormValues) {
    onConfirm({
      ...result,
      storeName: values.storeName,
      date: values.date,
      total: Number(values.total),
      paymentMethod: values.paymentMethod,
      items: values.items.map((item) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        vatRate: Number(item.vatRate) || 0,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {result.isInstallment && result.installmentOptions.length > 0 && (
        <div className="rounded-control border border-border bg-bg p-3">
          <p className="mb-2 text-sm font-medium text-text-primary">Taksit Seçenekleri</p>
          <div className="flex flex-wrap gap-2">
            {result.installmentOptions.map((opt) => (
              <Badge key={opt.count} tone={opt.badge ? "accent" : "neutral"}>
                {opt.label}: {formatCurrency(opt.monthlyAmount)}
                {opt.badge ? ` · ${opt.badge}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="storeName">İşyeri</Label>
          <Input id="storeName" {...register("storeName")} />
        </div>
        <div>
          <Label htmlFor="date">Tarih</Label>
          <Input id="date" type="date" {...register("date")} />
        </div>
        <div>
          <Label htmlFor="total">Toplam Tutar</Label>
          <Input id="total" type="number" step="0.01" {...register("total")} />
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
      </div>

      {fields.length > 0 && (
        <div>
          <Label>Kalemler</Label>
          <div className="space-y-2">
            <div className="flex gap-2 text-xs font-medium text-text-secondary px-1 pb-1">
              <div className="flex-[2]">Ürün / Hizmet</div>
              <div className="flex-1">Kategori</div>
              <div className="w-24">Birim Fiyat (₺)</div>
              <div className="w-16">Miktar</div>
              <div className="w-20">Birim</div>
              <div className="w-16">KDV %</div>
              <div className="w-9"></div>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  className="flex-[2]"
                  placeholder="Ürün adı"
                  {...register(`items.${index}.name`)}
                />
                <Select className="flex-1" {...register(`items.${index}.category`)}>
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
                <Input
                  className="w-24"
                  type="number"
                  step="0.01"
                  placeholder="Fiyat"
                  {...register(`items.${index}.price`)}
                />
                <Input
                  className="w-16"
                  type="number"
                  step="any"
                  placeholder="Adet/Miktar"
                  {...register(`items.${index}.quantity`)}
                />
                <Select className="w-20" {...register(`items.${index}.unit`)}>
                  <option value="adet">adet</option>
                  <option value="kg">kg</option>
                </Select>
                <Input
                  className="w-16"
                  type="number"
                  step="1"
                  placeholder="KDV"
                  {...register(`items.${index}.vatRate`)}
                />
                <button
                  type="button"
                  aria-label="Kalemi sil"
                  onClick={() => remove(index)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {liveTotalVat > 0 && (
              <div className="flex justify-end gap-2 pt-1 pr-11 text-sm">
                <span className="font-medium text-text-secondary">Toplam KDV:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(liveTotalVat)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          İptal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor…" : "Onayla ve Kaydet"}
        </Button>
      </div>
    </form>
  );
}
