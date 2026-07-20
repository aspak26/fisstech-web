"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { currentMonthString, formatMonthLabel } from "@/lib/utils/date";
import { setLimit, PAYMENT_METHOD_OPTIONS, type CategoryLimitData } from "@/lib/data/limits";
import type { CategoriesRow } from "@/lib/types/database";

type LimitType = "category" | "monthly" | "payment_method";

const TYPE_OPTIONS: { value: LimitType; label: string }[] = [
  { value: "category", label: "Kategori" },
  { value: "monthly", label: "Aylık Toplam" },
  { value: "payment_method", label: "Ödeme Yöntemi" },
];

function nextMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

/** Ported from mobile's _LimitSheet — type is only choosable when creating a
 * new limit; editing an existing one only changes the amount. */
export function LimitFormDialog({
  open,
  onClose,
  existing,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  existing: CategoryLimitData | null;
  categories: CategoriesRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [limitType, setLimitType] = useState<LimitType>("category");
  const [month, setMonth] = useState(currentMonthString());
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [cardLabel, setCardLabel] = useState("");
  const { register, handleSubmit, reset } = useForm<{ amount: number }>({
    values: { amount: existing?.limit ?? 0 },
  });
  const months = nextMonths(6);

  function handleClose() {
    reset();
    setLimitType("category");
    setMonth(currentMonthString());
    setCategoryId("");
    setPaymentMethod("credit_card");
    setCardLabel("");
    onClose();
  }

  async function onSubmit(values: { amount: number }) {
    const amount = Number(values.amount);
    if (!amount || amount <= 0) return;
    if (!existing && limitType === "category" && !categoryId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await setLimit(supabase, user.id, {
        limitType: existing?.limitType ?? limitType,
        amount,
        categoryId: existing ? existing.categoryId : categoryId,
        paymentMethod: existing ? existing.paymentMethod : paymentMethod,
        cardLabel: existing ? existing.cardLabel : cardLabel || null,
        month: existing?.month ?? month,
        existingId: existing?.id ?? null,
      });
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title={existing ? "Limiti Düzenle" : "Limit Belirle"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!existing && (
          <>
            <div>
              <Label>Limit Türü</Label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setLimitType(t.value)}
                    className={cn(
                      "rounded-control border px-3 py-1.5 text-sm font-medium",
                      limitType === t.value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-text-secondary hover:border-accent",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="limit-month">Ay</Label>
              <Select id="limit-month" value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </Select>
            </div>
          </>
        )}

        {existing ? (
          <div className="flex items-center gap-2 rounded-control border border-border p-3">
            <span className="text-lg">{existing.icon}</span>
            <span className="font-medium text-text-primary">{existing.name}</span>
          </div>
        ) : limitType === "category" ? (
          <div>
            <Label htmlFor="limit-category">Kategori</Label>
            <Select id="limit-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Kategori seç…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Select>
          </div>
        ) : limitType === "payment_method" ? (
          <>
            <div>
              <Label htmlFor="limit-payment">Ödeme Yöntemi</Label>
              <Select id="limit-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHOD_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.emoji} {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="limit-card-label">Kart Adı / Son 4 Hane (opsiyonel)</Label>
              <Input
                id="limit-card-label"
                placeholder="örn. Garanti 1234"
                value={cardLabel}
                onChange={(e) => setCardLabel(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-control border border-border p-3">
            <span className="text-lg">🗓</span>
            <span className="font-medium text-text-primary">{formatMonthLabel(month)}</span>
          </div>
        )}

        <div>
          <Label htmlFor="limit-amount">Bütçe (₺)</Label>
          <Input id="limit-amount" type="number" step="0.01" autoFocus {...register("amount")} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
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
