"use client";

import { useState } from "react";
import { Plus, Package, ArrowLeftRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteStockItem } from "@/lib/data/esnaf";
import type { BusinessRow, StockItemRow } from "@/lib/types/esnaf";
import { StockItemFormDialog } from "./stock-item-form-dialog";
import { StockMovementDialog } from "./stock-movement-dialog";

export function StockList({
  business,
  items,
}: {
  business: BusinessRow;
  items: StockItemRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<StockItemRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Stok Ürünü Ekle
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={Package} title="Henüz stok ürünü eklenmedi" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => {
              const critical = Number(item.current_qty) <= Number(item.critical_qty);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-text-primary">{item.name}</p>
                      {critical && <Badge tone="danger">Kritik</Badge>}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {item.current_qty} {item.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMovementItem(item)}
                    className="flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1.5 text-sm text-text-primary hover:border-accent"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Hareket
                  </button>
                  <DeleteButton
                    confirmMessage={`"${item.name}" silinsin mi?`}
                    onDelete={() => deleteStockItem(createClient(), item.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <StockItemFormDialog open={addOpen} onClose={() => setAddOpen(false)} business={business} />
      <StockMovementDialog item={movementItem} onClose={() => setMovementItem(null)} />
    </div>
  );
}
