"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { CategoryOption } from "@/lib/scan/types";
import type { ExpenseWithItems } from "@/lib/data/expenses";

const PAYMENT_METHODS = [
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi Kartı" },
  { value: "debit_card", label: "Banka Kartı" },
  { value: "unknown", label: "Bilinmiyor" },
];

interface FormValues {
  storeName: string;
  date: string;
  paymentMethod: string;
  note: string;
  items: { name: string; category: string; price: number; quantity: number }[];
}

export function ExpenseFormDialog({
  open,
  onClose,
  categories,
  expense,
  categoryNamesById,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  expense?: ExpenseWithItems;
  categoryNamesById: Map<string, string>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, reset } = useForm<FormValues>({
    values: {
      storeName: expense?.store_name ?? "",
      date: expense?.date ?? new Date().toISOString().slice(0, 10),
      paymentMethod: expense?.payment_method ?? "cash",
      note: expense?.note ?? "",
      items: expense
        ? expense.expense_items.map((i) => ({
            name: i.name,
            category: categoryNamesById.get(i.category_id ?? "") ?? "Diğer",
            price: Number(i.price),
            quantity: i.quantity,
          }))
        : [{ name: "", category: categories[0]?.name ?? "Diğer", price: 0, quantity: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const categoryNames = [...new Set(categories.map((c) => c.name))];

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");

      const { data: rawCategories } = await supabase.from("categories").select("id, name");
      const categoryMap = new Map<string, string>(
        (rawCategories ?? []).map((c: { id: string; name: string }) => [c.name, c.id]),
      );
      const total = values.items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

      if (expense) {
        await supabase
          .from("expenses")
          .update({
            store_name: values.storeName || null,
            date: values.date,
            total,
            payment_method: values.paymentMethod,
            note: values.note || null,
          })
          .eq("id", expense.id);
        await supabase.from("expense_items").delete().eq("expense_id", expense.id);
        await supabase.from("expense_items").insert(
          values.items.map((item) => ({
            expense_id: expense.id,
            name: item.name,
            category_id: categoryMap.get(item.category) ?? null,
            price: item.price,
            quantity: item.quantity,
          })),
        );
      } else {
        const { data: created, error: insertError } = await supabase
          .from("expenses")
          .insert({
            user_id: user.id,
            store_name: values.storeName || null,
            date: values.date,
            total,
            payment_method: values.paymentMethod,
            note: values.note || null,
          })
          .select("id")
          .single();
        if (insertError || !created) throw insertError ?? new Error("Kaydedilemedi");

        await supabase.from("expense_items").insert(
          values.items.map((item) => ({
            expense_id: created.id,
            name: item.name,
            category_id: categoryMap.get(item.category) ?? null,
            price: item.price,
            quantity: item.quantity,
          })),
        );
      }

      reset();
      onClose();
      router.refresh();
    } catch {
      setError("Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={expense ? "Harcamayı Düzenle" : "Manuel Harcama Ekle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="note">Not (opsiyonel)</Label>
            <Input id="note" {...register("note")} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="mb-0">Kalemler</Label>
            <button
              type="button"
              onClick={() =>
                append({ name: "", category: categories[0]?.name ?? "Diğer", price: 0, quantity: 1 })
              }
              className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Kalem ekle
            </button>
          </div>
          <div className="space-y-2">
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
                  step="1"
                  placeholder="Adet"
                  {...register(`items.${index}.quantity`)}
                />
                <button
                  type="button"
                  aria-label="Kalemi sil"
                  onClick={() => fields.length > 1 && remove(index)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : expense ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
