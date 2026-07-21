"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { assetTypeEmoji, assetTypeLabel, assetTypeSymbol } from "@/lib/investment-asset-types";
import { deleteInvestment, type InvestmentRow } from "@/lib/data/investments";
import { InvestmentFormDialog } from "./investment-form-dialog";

/** currentValue/profitLoss/profitLossPercent ported from mobile's
 * Investment model getters — same formulas, same `prices` shape
 * (asset_type key → TRY price). */
function currentValue(inv: InvestmentRow, prices: Record<string, number>): number {
  return Number(inv.amount) * (prices[inv.asset_type] ?? 0);
}
function profitLoss(inv: InvestmentRow, prices: Record<string, number>): number | null {
  if (!inv.purchase_price) return null;
  return currentValue(inv, prices) - Number(inv.amount) * Number(inv.purchase_price);
}

export function InvestmentsList({
  investments,
  prices,
}: {
  investments: InvestmentRow[];
  prices: Record<string, number>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasLivePrices = Object.keys(prices).length > 0;

  const totalValue = investments.reduce((s, inv) => s + currentValue(inv, prices), 0);
  const totalCost = investments.reduce((s, inv) => s + (inv.purchase_price ? Number(inv.purchase_price) * Number(inv.amount) : 0), 0);
  const totalPl = totalCost > 0 ? totalValue - totalCost : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {hasLivePrices
            ? "Canlı piyasa fiyatlarıyla (Truncgil altın/döviz, CoinGecko kripto) güncel değer."
            : "Canlı fiyatlar şu an alınamadı — alış maliyeti üzerinden takip."}
        </p>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" /> Yatırım Ekle
        </Button>
      </div>

      {hasLivePrices && investments.length > 0 && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Toplam Değer</p>
            <p className="font-display text-2xl font-bold text-text-primary">{formatCurrency(totalValue)}</p>
          </div>
          {totalPl !== null && (
            <div className={cn("flex items-center gap-1 text-right font-medium", totalPl >= 0 ? "text-success" : "text-danger")}>
              {totalPl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(totalPl)}
            </div>
          )}
        </Card>
      )}

      <Card>
        {investments.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Henüz yatırım eklenmedi" description="Altın, döviz veya kripto varlığını ekle." />
        ) : (
          <ul className="divide-y divide-border">
            {investments.map((inv) => {
              const cost = inv.purchase_price ? Number(inv.purchase_price) * Number(inv.amount) : null;
              const value = hasLivePrices ? currentValue(inv, prices) : null;
              const pl = hasLivePrices ? profitLoss(inv, prices) : null;
              return (
                <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-xl">{assetTypeEmoji(inv.asset_type)}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">
                        {assetTypeLabel(inv.asset_type)}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {inv.amount} {assetTypeSymbol(inv.asset_type)}
                        {inv.purchase_date ? ` · ${inv.purchase_date}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {value !== null ? (
                      <>
                        <p className="font-medium text-text-primary">{formatCurrency(value)}</p>
                        {pl !== null && (
                          <p className={cn("text-xs font-medium", pl >= 0 ? "text-success" : "text-danger")}>
                            {pl >= 0 ? "+" : ""}
                            {formatCurrency(pl)}
                          </p>
                        )}
                      </>
                    ) : (
                      cost !== null && <span className="font-medium text-text-primary">{formatCurrency(cost)}</span>
                    )}
                  </div>
                  <DeleteButton
                    confirmMessage={`${assetTypeLabel(inv.asset_type)} kaydı silinsin mi?`}
                    onDelete={() => deleteInvestment(createClient(), inv.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <InvestmentFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
