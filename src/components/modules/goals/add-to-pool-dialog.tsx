"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PiggyBank, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { transferToPool, transferFromPool, type SavingsPoolRow } from "@/lib/data/goals";

type Direction = "toPool" | "fromPool";

/** Mobil GoalsService/SavingsBottomSheet ile birebir aynı: net bakiye ↔
 * birikim havuzu arasında iki yönlü aktarım. Havuza aktarılan para o ayki
 * Net Bakiye'den düşer, havuzdan çekilen geri eklenir (bkz. goals.ts). */
export function AddToPoolDialog({
  open,
  onClose,
  pool,
  netBalance,
}: {
  open: boolean;
  onClose: () => void;
  pool: SavingsPoolRow;
  netBalance: number;
}) {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("toPool");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = direction === "toPool" ? Math.max(0, netBalance) : Math.max(0, Number(pool.balance));

  function handleClose() {
    setAmount("");
    setError(null);
    setDirection("toPool");
    onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return;
    if (value > maxAmount) {
      setError(direction === "toPool" ? "Net bakiyenizi aşamazsınız" : "Birikim havuzunu aşamazsınız");
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
      if (direction === "toPool") {
        await transferToPool(supabase, user.id, value);
      } else {
        await transferFromPool(supabase, user.id, value);
      }
      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Birikim Havuzu">
      <div className="mb-4 space-y-2 rounded-control border border-border bg-bg p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Mevcut Net Bakiye</span>
          <span className={cn("font-semibold", netBalance >= 0 ? "text-success" : "text-danger")}>
            {formatCurrency(netBalance)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Birikim Havuzu</span>
          <span className="font-semibold text-accent">{formatCurrency(Number(pool.balance))}</span>
        </div>
      </div>

      <div className="mb-4 flex rounded-control bg-accent/10 p-1">
        <button
          type="button"
          onClick={() => {
            setDirection("toPool");
            setError(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-control py-2 text-sm font-semibold transition-colors",
            direction === "toPool" ? "bg-accent text-on-accent" : "text-accent/70",
          )}
        >
          <PiggyBank className="h-4 w-4" /> Havuza Yatır
        </button>
        <button
          type="button"
          onClick={() => {
            setDirection("fromPool");
            setError(null);
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-control py-2 text-sm font-semibold transition-colors",
            direction === "fromPool" ? "bg-accent text-on-accent" : "text-accent/70",
          )}
        >
          <Wallet className="h-4 w-4" /> Havuzdan Çek
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="pool-amount">Tutar (₺)</Label>
          <div className="flex gap-2">
            <Input
              id="pool-amount"
              type="text"
              inputMode="decimal"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={maxAmount <= 0}
              onClick={() => setAmount(maxAmount.toFixed(2).replace(".", ","))}
            >
              Tümü
            </Button>
          </div>
          {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
        </div>
        <p className="text-center text-xs text-text-secondary">
          {direction === "toPool"
            ? "Aktarım net bakiyenizden düşer."
            : "Çekilen tutar net bakiyenize eklenir."}
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : direction === "toPool" ? "Havuza Aktar" : "Havuzdan Çek"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
