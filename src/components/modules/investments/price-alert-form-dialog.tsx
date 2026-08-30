"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { ASSET_TYPES } from "@/lib/investment-asset-types";
import { addPriceAlert, deletePriceAlert, type PriceAlertRow } from "@/lib/data/price-alerts";

/** Ported from mobile's AddPriceAlertScreen. Düzenleme, mobildeki gibi
 * "mevcut alarmı sil, yenisini ekle" ile yapılıyor — ayrı bir update akışı
 * gerekmiyor. */
export function PriceAlertFormDialog({
  open,
  onClose,
  prices,
  existing,
  initialAssetType,
}: {
  open: boolean;
  onClose: () => void;
  prices: Record<string, number>;
  existing?: PriceAlertRow | null;
  initialAssetType?: string;
}) {
  const router = useRouter();
  const isEdit = !!existing;
  const [assetType, setAssetType] = useState<string>(existing?.asset_type ?? initialAssetType ?? ASSET_TYPES[0].key);
  const [direction, setDirection] = useState<"above" | "below">(existing?.direction ?? "above");
  const [targetPrice, setTargetPrice] = useState(existing ? String(existing.target_price).replace(".", ",") : "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = prices[assetType];

  function handleClose() {
    setError(null);
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(targetPrice.replace(/\./g, "").replace(",", "."));
    if (!price || price <= 0) {
      setError("Geçerli bir tutar giriniz");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isEdit) {
        await deletePriceAlert(supabase, existing!.id);
      }
      await addPriceAlert(supabase, user.id, {
        assetType,
        targetPrice: price,
        direction,
        note,
      });
      router.refresh();
      handleClose();
    } catch {
      setError("Alarm kaydedilemedi, lütfen tekrar deneyin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title={isEdit ? "Alarmı Düzenle" : "Fiyat Alarmı Ekle"}>
      <form onSubmit={onSubmit} className="space-y-4">
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
          {currentPrice !== undefined && (
            <p className="mt-2 text-sm font-medium text-accent">Anlık fiyat: {formatCurrency(currentPrice)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="alert-price">Hedef Fiyat (₺)</Label>
          <Input
            id="alert-price"
            placeholder="Örn: 10000"
            inputMode="decimal"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
          />
        </div>

        <div>
          <Label>Ne Zaman Bildirim Gelsin?</Label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDirection("above")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-control border py-3 text-center text-xs font-medium transition-colors",
                direction === "above"
                  ? "border-2 border-success bg-success/10 text-success"
                  : "border-border text-text-primary hover:border-success/40",
              )}
            >
              <TrendingUp className="h-5 w-5" />
              Bu fiyatın üstüne çıkınca
            </button>
            <button
              type="button"
              onClick={() => setDirection("below")}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-control border py-3 text-center text-xs font-medium transition-colors",
                direction === "below"
                  ? "border-2 border-danger bg-danger/10 text-danger"
                  : "border-border text-text-primary hover:border-danger/40",
              )}
            >
              <TrendingDown className="h-5 w-5" />
              Bu fiyatın altına inince
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="alert-note">Not (opsiyonel)</Label>
          <textarea
            id="alert-note"
            rows={2}
            placeholder="Örn: Satış için ideal fiyat"
            className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : isEdit ? "Güncelle" : "Alarm Kur"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
