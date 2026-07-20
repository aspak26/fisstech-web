"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Warehouse, Minus, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { adjustStock, deleteInventoryItem } from "@/lib/data/toptan";
import type { InventoryRow } from "@/lib/types/esnaf";
import { InventoryDialog } from "./inventory-dialog";

export function InventoryList({ businessId, items }: { businessId: string; items: InventoryRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | undefined>(undefined);

  const criticalCount = items.filter((i) => Number(i.current_stock) <= Number(i.critical_level)).length;

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(item: InventoryRow) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleAdjust(item: InventoryRow, delta: number) {
    await adjustStock(createClient(), item, delta);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {criticalCount > 0 ? (
          <Badge tone="danger" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {criticalCount} ürün kritik seviyede
          </Badge>
        ) : (
          <span />
        )}
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Depo Kaydı Ekle
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Warehouse} title="Depo boş" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const isCritical = Number(item.current_stock) <= Number(item.critical_level);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                  <button type="button" onClick={() => openEdit(item)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-text-primary">{item.name}</p>
                      {isCritical && <Badge tone="danger">Kritik</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {item.category ? `${item.category} · ` : ""}
                      {formatCurrency(Number(item.selling_price))} / {item.unit_type}
                    </p>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Azalt"
                      onClick={() => handleAdjust(item, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary hover:border-accent"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-16 text-center font-medium text-text-primary">
                      {Number(item.current_stock)} {item.unit_type}
                    </span>
                    <button
                      type="button"
                      aria-label="Artır"
                      onClick={() => handleAdjust(item, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-control border border-border text-text-secondary hover:border-accent"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <DeleteButton
                    confirmMessage={`"${item.name}" silinsin mi?`}
                    onDelete={() => deleteInventoryItem(createClient(), item.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <InventoryDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        businessId={businessId}
        item={editing}
      />
    </div>
  );
}
