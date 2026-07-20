"use client";

import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteServiceCatalogItem } from "@/lib/data/hizmet";
import type { ServiceCatalogRow } from "@/lib/types/esnaf";
import { ServiceCatalogDialog } from "./service-catalog-dialog";

export function ServiceCatalogList({
  businessId,
  items,
}: {
  businessId: string;
  items: ServiceCatalogRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCatalogRow | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(item: ServiceCatalogRow) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Hizmet Ekle
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={BookOpen} title="Henüz hizmet tanımlanmadı" />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <button type="button" onClick={() => openEdit(item)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-text-primary">{item.name}</p>
                  <p className="text-sm text-text-secondary">{item.duration_minutes} dk</p>
                </button>
                <span className="font-medium text-text-primary">{formatCurrency(Number(item.default_price))}</span>
                <DeleteButton
                  confirmMessage={`"${item.name}" silinsin mi?`}
                  onDelete={() => deleteServiceCatalogItem(createClient(), item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ServiceCatalogDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        businessId={businessId}
        item={editing}
      />
    </div>
  );
}
