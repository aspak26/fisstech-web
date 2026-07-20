"use client";

import { useMemo, useState } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { deleteSalePortfolio } from "@/lib/data/satis";
import { PORTFOLIO_CATEGORIES, type PortfolioStatus, type SalePortfolioRow } from "@/lib/types/esnaf";
import { PortfolioDialog } from "./portfolio-dialog";

const STATUS_LABEL: Record<PortfolioStatus, string> = {
  satista: "Satışta",
  rezerve: "Rezerve",
  satildi: "Satıldı",
};

const STATUS_TONE: Record<PortfolioStatus, "success" | "warning" | "neutral"> = {
  satista: "success",
  rezerve: "warning",
  satildi: "neutral",
};

export function PortfolioList({ businessId, items }: { businessId: string; items: SalePortfolioRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalePortfolioRow | undefined>(undefined);
  const [filter, setFilter] = useState<"all" | PortfolioStatus>("all");

  const categoryMap = new Map(PORTFOLIO_CATEGORIES.map((c) => [c.value, c]));
  const visible = useMemo(() => (filter === "all" ? items : items.filter((i) => i.status === filter)), [items, filter]);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(item: SalePortfolioRow) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "satista", "rezerve", "satildi"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === s ? "border-accent bg-accent text-on-accent" : "border-border bg-surface text-text-secondary hover:border-accent",
              )}
            >
              {s === "all" ? "Tümü" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Portföye Ekle
        </Button>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Portföy boş" />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((item) => {
              const category = categoryMap.get(item.category);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <button type="button" onClick={() => openEdit(item)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-text-primary">
                        {category?.emoji} {item.title}
                      </p>
                      <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    </div>
                    <p className="truncate text-sm text-text-secondary">{category?.label}</p>
                  </button>
                  <span className="font-medium text-text-primary">
                    {formatCurrency(Number(item.status === "satildi" ? (item.sold_price ?? item.list_price) : item.list_price))}
                  </span>
                  <DeleteButton
                    confirmMessage={`"${item.title}" silinsin mi?`}
                    onDelete={() => deleteSalePortfolio(createClient(), item.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <PortfolioDialog key={editing?.id ?? "new"} open={dialogOpen} onClose={() => setDialogOpen(false)} businessId={businessId} item={editing} />
    </div>
  );
}
