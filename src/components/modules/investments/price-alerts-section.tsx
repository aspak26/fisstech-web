"use client";

import { useState } from "react";
import { Bell, BellRing, BellOff, Pencil, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { assetTypeEmoji, assetTypeLabel } from "@/lib/investment-asset-types";
import { deletePriceAlert, toggleAlertActive, isAlertTriggeredBy, type PriceAlertRow } from "@/lib/data/price-alerts";
import { PriceAlertFormDialog } from "./price-alert-form-dialog";

/** Ported from mobile's price alert list (investment_list_screen.dart) —
 * web tarafında `price_alerts` tablosu vardı ama hiç arayüzü yoktu. */
export function PriceAlertsSection({
  alerts,
  prices,
}: {
  alerts: PriceAlertRow[];
  prices: Record<string, number>;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PriceAlertRow | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(alert: PriceAlertRow) {
    setEditing(alert);
    setDialogOpen(true);
  }

  async function handleToggleActive(alert: PriceAlertRow) {
    const supabase = createClient();
    await toggleAlertActive(supabase, alert.id, !alert.is_active);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-text-primary">Fiyat Alarmları</h2>
        <Button variant="secondary" size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Alarm Kur
        </Button>
      </div>

      <Card>
        {alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Henüz bir fiyat alarmı yok"
            description="Bir varlık hedef fiyata ulaşınca bildirim al."
          />
        ) : (
          <ul className="divide-y divide-border">
            {alerts.map((alert) => {
              const currentPrice = prices[alert.asset_type];
              const triggered = alert.is_triggered || (currentPrice !== undefined && isAlertTriggeredBy(alert, currentPrice));
              return (
                <li key={alert.id} className="flex items-center gap-3 py-3">
                  <span className="text-xl">{assetTypeEmoji(alert.asset_type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium text-text-primary">{assetTypeLabel(alert.asset_type)}</p>
                      {alert.direction === "above" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-danger" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {alert.direction === "above" ? "Üstüne çıkınca" : "Altına inince"}: {formatCurrency(alert.target_price)}
                    </p>
                    {alert.note && <p className="mt-0.5 text-xs text-text-secondary italic">{alert.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(alert)}
                    title={alert.is_active ? "Alarmı kapat" : "Alarmı aç"}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-control",
                      triggered && alert.is_active ? "text-accent" : "text-text-secondary hover:bg-bg",
                    )}
                  >
                    {!alert.is_active ? (
                      <BellOff className="h-4 w-4" />
                    ) : triggered ? (
                      <BellRing className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(alert)}
                    title="Düzenle"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-bg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <DeleteButton
                    confirmMessage={`${assetTypeLabel(alert.asset_type)} alarmı silinsin mi?`}
                    onDelete={() => deletePriceAlert(createClient(), alert.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {dialogOpen && (
        <PriceAlertFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          prices={prices}
          existing={editing}
        />
      )}
    </div>
  );
}
