"use client";

import { PiggyBank, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import type { SavingsPoolRow } from "@/lib/data/goals";

/** Ported from mobile's _SavingsPoolCard — gradient hero card at the top of
 * the goals list, showing the pool's total balance. */
export function SavingsPoolCard({ pool, onAddFunds }: { pool: SavingsPoolRow; onAddFunds: () => void }) {
  return (
    <div className="rounded-card bg-gradient-to-br from-accent to-accent-hover p-5 text-on-accent shadow-lg shadow-accent/20">
      <div className="flex items-center gap-2">
        <PiggyBank className="h-4 w-4 opacity-80" />
        <span className="text-xs font-bold tracking-wide opacity-80">BİRİKİM HAVUZU</span>
        <button
          type="button"
          onClick={onAddFunds}
          className="ml-auto flex items-center gap-1 rounded-control bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30"
        >
          <Plus className="h-3.5 w-3.5" /> Para Ekle
        </button>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{formatCurrency(Number(pool.balance))}</p>
    </div>
  );
}
