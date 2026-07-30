"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { ASSET_TYPES } from "@/lib/investment-asset-types";

interface FormValues {
  amount: string;
  purchasePrice: string;
  purchaseDate: string;
  note: string;
}

function parseLocaleNumber(v: string): number | null {
  const n = parseFloat(v.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Ported from mobile's AddInvestmentScreen — asset tipini renkli chip
 * grid'iyle seçme, "Birim Fiyatı / Toplam Tutar" giriş modu anahtarı (mod
 * değişince mevcut değeri otomatik çeviriyor), opsiyonel tarih/not. Web'in
 * eski hali sade bir dropdown'dı, mobille aynı detay seviyesine getirildi. */
export function InvestmentFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [assetType, setAssetType] = useState<string>(ASSET_TYPES[0].key);
  const [totalMode, setTotalMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: { amount: "", purchasePrice: "", purchaseDate: "", note: "" },
  });

  const symbol = ASSET_TYPES.find((a) => a.key === assetType)?.symbol ?? "";

  function toggleMode(next: boolean) {
    if (totalMode === next) return;
    const amount = parseLocaleNumber(watch("amount"));
    const current = parseLocaleNumber(watch("purchasePrice"));
    if (amount && amount > 0 && current && current > 0) {
      const converted = next ? current * amount : current / amount;
      setValue("purchasePrice", String(Math.round(converted * 100) / 100).replace(".", ","));
    }
    setTotalMode(next);
  }

  function handleClose() {
    reset();
    setAssetType(ASSET_TYPES[0].key);
    setTotalMode(false);
    setError(null);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const amount = parseLocaleNumber(values.amount);
    if (!amount || amount <= 0) {
      setError("Geçerli bir miktar girin");
      return;
    }

    let purchasePrice: number | null = null;
    if (values.purchasePrice.trim()) {
      const parsed = parseLocaleNumber(values.purchasePrice);
      if (!parsed || parsed <= 0) {
        setError("Geçerli bir fiyat girin");
        return;
      }
      purchasePrice = totalMode ? parsed / amount : parsed;
    }

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error: insertError } = await supabase.from("investments").insert({
        user_id: user.id,
        asset_type: assetType,
        amount,
        purchase_price: purchasePrice,
        purchase_date: values.purchaseDate || null,
        note: values.note.trim() || null,
      });
      if (insertError) throw insertError;

      router.refresh();
      handleClose();
    } catch {
      setError("Yatırım eklenemedi, lütfen tekrar deneyin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Yatırım Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Varlık Tipi</Label>
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((a) => {
              const selected = assetType === a.key;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAssetType(a.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-control border px-3 py-2 text-sm transition-colors",
                    selected ? "font-semibold" : "border-border bg-surface text-text-primary hover:border-accent/40",
                  )}
                  style={
                    selected
                      ? { borderColor: a.color, backgroundColor: `${a.color}22`, color: a.color, borderWidth: 2 }
                      : undefined
                  }
                >
                  <span>{a.emoji}</span>
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="i-amount">Miktar ({symbol})</Label>
          <Input
            id="i-amount"
            placeholder="Örn: 10,5"
            inputMode="decimal"
            {...register("amount", { required: true })}
          />
        </div>

        <div>
          <Label>Fiyat Giriş Tipi</Label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={cn(
                "rounded-control border py-2.5 text-sm font-medium transition-colors",
                !totalMode ? "border-2 border-accent bg-accent/10 text-accent" : "border-border text-text-primary hover:border-accent/40",
              )}
            >
              Birim Fiyatı
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={cn(
                "rounded-control border py-2.5 text-sm font-medium transition-colors",
                totalMode ? "border-2 border-accent bg-accent/10 text-accent" : "border-border text-text-primary hover:border-accent/40",
              )}
            >
              Toplam Tutar
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="purchasePrice">
            {totalMode ? "Alış Fiyatı — Toplam Tutar (opsiyonel)" : `Alış Fiyatı — TL/${symbol} (opsiyonel)`}
          </Label>
          <p className="mb-1.5 -mt-1 text-xs text-text-secondary">
            {totalMode
              ? "Yatırım için ödediğiniz toplam tutarı girin."
              : `Tek 1 ${symbol} için ödediğiniz fiyatı girin (toplam ödediğiniz tutarı değil).`}
          </p>
          <Input
            id="purchasePrice"
            placeholder={totalMode ? "Örn: 15000" : "Örn: 4100,00"}
            inputMode="decimal"
            {...register("purchasePrice")}
          />
        </div>

        <div>
          <Label htmlFor="purchaseDate">Alış Tarihi (opsiyonel)</Label>
          <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
        </div>

        <div>
          <Label htmlFor="i-note">Not (opsiyonel)</Label>
          <textarea
            id="i-note"
            rows={2}
            placeholder="Örn: Ziraat bankasından aldım"
            className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("note")}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

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
