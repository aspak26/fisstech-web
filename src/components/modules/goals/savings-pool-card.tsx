"use client";

import { PiggyBank, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import type { SavingsPoolRow } from "@/lib/data/goals";

/** Ported from mobile's _SavingsPoolCard — kâğıt kart (mobilde de yeşil
 * dolgu yerine kâğıt), bant + ikon lekesi + birincil "Yönet" düğmesi. */
export function SavingsPoolCard({ pool, onAddFunds }: { pool: SavingsPoolRow; onAddFunds: () => void }) {
  return (
    <div className="relative rounded-card border-[1.5px] border-ink/80 bg-surface p-5 shadow-md">
      <span aria-hidden="true" className="tape -top-3 right-10 rotate-3" />
      <div className="flex items-center gap-2">
        <span className="spot flex h-7 w-7 items-center justify-center">
          <PiggyBank className="h-5 w-5 text-text-primary" />
        </span>
        <span className="text-xs font-bold tracking-wide text-text-secondary">BİRİKİM HAVUZU</span>
        <button
          type="button"
          onClick={onAddFunds}
          className="press ml-auto flex items-center gap-1 rounded-control border-[1.5px] border-ink/80 bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent shadow-xs hover:bg-accent-hover"
        >
          <Plus className="h-3.5 w-3.5" /> Yönet
        </button>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-accent">{formatCurrency(Number(pool.balance))}</p>
    </div>
  );
}
