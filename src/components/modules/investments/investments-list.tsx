"use client";

import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { assetTypeEmoji, assetTypeLabel, assetTypeSymbol } from "@/lib/investment-asset-types";
import { deleteInvestment, type InvestmentRow } from "@/lib/data/investments";
import { InvestmentFormDialog } from "./investment-form-dialog";

export function InvestmentsList({ investments }: { investments: InvestmentRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Canlı piyasa fiyatları bu fazda henüz bağlanmadı — alış maliyeti üzerinden takip.
        </p>
        <Button onClick={() => setDialogOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" /> Yatırım Ekle
        </Button>
      </div>

      <Card>
        {investments.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Henüz yatırım eklenmedi" description="Altın, döviz veya kripto varlığını ekle." />
        ) : (
          <ul className="divide-y divide-border">
            {investments.map((inv) => {
              const cost = inv.purchase_price ? Number(inv.purchase_price) * Number(inv.amount) : null;
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
                  {cost !== null && (
                    <span className="font-medium text-text-primary">{formatCurrency(cost)}</span>
                  )}
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
