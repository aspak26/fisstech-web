"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { allocateToGoal, type GoalRow } from "@/lib/data/goals";

/** Ported from mobile's _AllocateDialog — money always comes from the
 * savings pool (never straight into a goal), validated server-side by the
 * `allocate_to_goal` RPC (pool balance + goal target). */
export function ContributeDialog({
  goal,
  poolBalance,
  onClose,
  onAddFunds,
}: {
  goal: GoalRow | null;
  poolBalance: number;
  onClose: () => void;
  onAddFunds: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<{ amount: number }>({
    defaultValues: { amount: 0 },
  });
  const amount = Number(watch("amount")) || 0;

  const remaining = goal ? Math.max(0, Number(goal.target_amount) - Number(goal.saved_amount)) : 0;
  const maxAmount = Math.max(0, Math.min(poolBalance, remaining));

  async function onSubmit(values: { amount: number }) {
    if (!goal) return;
    const n = Number(values.amount);
    if (!n || n <= 0) {
      setError("Geçerli bir tutar girin");
      return;
    }
    if (n > poolBalance) {
      setError("Havuz bakiyesi yetersiz");
      return;
    }
    if (n > remaining) {
      setError("Hedef tutarını aşamazsınız");
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
      await allocateToGoal(supabase, user.id, goal.id, n);
      reset();
      onClose();
      router.refresh();
    } catch {
      setError("Aktarılamadı, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!goal} onClose={onClose} title={`${goal?.emoji ?? ""} ${goal?.name ?? ""} — Para Ekle`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <p className="text-xs text-text-secondary">Para kaynağı: Birikim Havuzu</p>
          <div className="mt-0.5 flex items-center justify-between">
            <span className={cn("text-sm font-semibold", poolBalance > 0 ? "text-accent" : "text-danger")}>
              Havuz: {formatCurrency(poolBalance)} • Kalan: {formatCurrency(remaining)}
            </span>
            {poolBalance <= 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddFunds();
                }}
                className="text-xs font-medium text-accent hover:underline"
              >
                + Ekle
              </button>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="c-amount">Tutar (₺)</Label>
          <div className="flex gap-2">
            <Input id="c-amount" type="number" step="0.01" autoFocus {...register("amount")} />
            <Button type="button" variant="secondary" onClick={() => setValue("amount", maxAmount)}>
              Max
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving || amount <= 0}>
            {saving ? "Aktarılıyor…" : "Aktar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
