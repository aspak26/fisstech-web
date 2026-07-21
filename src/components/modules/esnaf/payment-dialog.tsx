"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { payOrder, type RestaurantOrderRow } from "@/lib/data/restaurant";

type Mode = "nakit" | "kart" | "karisik" | "alman";
const MODES: { value: Mode; label: string }[] = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kart" },
  { value: "karisik", label: "Karışık" },
  { value: "alman", label: "Kişi Başı Hesap" },
];

/** Ported from mobile's odeme_al_screen.dart. All 4 modes charge the full
 * remaining balance — "Kişi Başı Hesap" (mobile's "alman") shows a
 * per-person split as a mental-math aid but still charges the whole
 * remainder as one cash payment, exactly like mobile (it never records
 * separate per-guest payments — see PROGRESS.md). The item-level partial
 * payment mode mobile has built but never exposes in its UI wasn't ported. */
export function PaymentDialog({
  open,
  onClose,
  businessId,
  order,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  order: RestaurantOrderRow;
  onDone: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("nakit");
  const [cashInput, setCashInput] = useState("");
  const [guestCount, setGuestCount] = useState(order.guest_count ?? 2);
  const [saving, setSaving] = useState(false);

  const remaining = Math.max(0, Number(order.total_amount) - Number(order.paid_amount));
  const cashAmountForMixed = Math.min(remaining, Number(cashInput.replace(",", ".")) || 0);

  async function handlePay() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let cashAmount = 0;
      let cardAmount = 0;
      if (mode === "nakit" || mode === "alman") cashAmount = remaining;
      else if (mode === "kart") cardAmount = remaining;
      else if (mode === "karisik") {
        cashAmount = cashAmountForMixed;
        cardAmount = remaining - cashAmountForMixed;
      }

      await payOrder(supabase, businessId, user.id, order, { cashAmount, cardAmount });
      onDone();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Tahsil Et">
      <div className="space-y-4">
        <p className="text-center font-display text-2xl font-bold text-text-primary">{formatCurrency(remaining)}</p>

        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-control border px-3 py-2.5 text-sm font-medium",
                mode === m.value ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-accent",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "karisik" && (
          <div>
            <Label htmlFor="cash-amount">Nakit Tutar</Label>
            <Input
              id="cash-amount"
              type="number"
              step="0.01"
              autoFocus
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="0"
            />
            <p className="mt-1 text-xs text-text-secondary">Kart ile kalan: {formatCurrency(remaining - cashAmountForMixed)}</p>
          </div>
        )}

        {mode === "alman" && (
          <div>
            <Label htmlFor="guest-split">Kişi Sayısı</Label>
            <Input
              id="guest-split"
              type="number"
              min={1}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-24"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Kişi başı: {formatCurrency(remaining / Math.max(1, guestCount))} — tüm tutar tek seferde nakit tahsil edilir.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="button" disabled={saving || remaining <= 0} onClick={handlePay}>
            {saving ? "Kaydediliyor…" : "Tahsil Et"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
