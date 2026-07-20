"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Wallet, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { formatMonthLabel } from "@/lib/utils/date";
import { deleteLimit, type CategoryLimitData } from "@/lib/data/limits";
import type { CategoriesRow } from "@/lib/types/database";
import { LimitFormDialog } from "./limit-form-dialog";

/** Ported from mobile's analytics_screen.dart Bütçe/Limit card — per-limit
 * progress bar (green → 80%+ orange "warning" → over-limit red), current
 * month only shows real spend, future (planned) months show "—". */
export function BudgetLimitsCard({
  limits,
  categories,
  currentMonth,
}: {
  limits: CategoryLimitData[];
  categories: CategoriesRow[];
  currentMonth: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryLimitData | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Bu limit silinsin mi?")) return;
    await deleteLimit(createClient(), id);
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-text-primary">Bütçe Limitleri</h3>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Limit Belirle
        </Button>
      </div>

      {limits.length === 0 ? (
        <EmptyState icon={Wallet} title="Henüz bütçe limiti eklenmedi" description={'"Limit Belirle" ile başlayın.'} />
      ) : (
        <div className="space-y-4">
          {limits.map((limit) => {
            const isFuture = limit.month !== currentMonth;
            const barColor = isFuture
              ? "bg-text-secondary/30"
              : limit.isExceeded
                ? "bg-danger"
                : limit.isWarning
                  ? "bg-accent"
                  : "bg-success";
            return (
              <div key={limit.id}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-lg">{limit.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{limit.name}</p>
                    {isFuture && <p className="text-xs text-text-secondary">{formatMonthLabel(limit.month)}</p>}
                  </div>
                  {isFuture ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      Planlandı
                    </span>
                  ) : (
                    limit.isExceeded && (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-semibold text-danger">
                        Limit Aşıldı
                      </span>
                    )
                  )}
                  <button
                    type="button"
                    aria-label="Limiti düzenle"
                    onClick={() => {
                      setEditing(limit);
                      setDialogOpen(true);
                    }}
                    className="text-text-secondary hover:text-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Limiti sil"
                    onClick={() => handleDelete(limit.id)}
                    className="text-text-secondary hover:text-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                  <div className={cn("h-full rounded-full", barColor)} style={{ width: `${limit.progress * 100}%` }} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className={isFuture ? "text-text-secondary" : "text-text-primary"}>
                    {isFuture ? "—" : `Harcanan: ${formatCurrency(limit.spent)}`}
                  </span>
                  <span className="text-text-secondary">Bütçe: {formatCurrency(limit.limit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LimitFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={editing}
        categories={categories}
      />
    </Card>
  );
}
