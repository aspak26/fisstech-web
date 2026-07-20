"use client";

import { useState } from "react";
import { Plus, Contact } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteHizmetCustomer } from "@/lib/data/hizmet";
import type { HizmetCustomerRow } from "@/lib/types/esnaf";
import { HizmetMusteriDialog } from "./hizmet-musteri-dialog";

export function HizmetMusteriList({
  businessId,
  customers,
}: {
  businessId: string;
  customers: HizmetCustomerRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HizmetCustomerRow | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(customer: HizmetCustomerRow) {
    setEditing(customer);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Müşteri Ekle
        </Button>
      </div>

      <Card>
        {customers.length === 0 ? (
          <EmptyState icon={Contact} title="Henüz müşteri yok" />
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <button type="button" onClick={() => openEdit(c)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-text-primary">{c.name}</p>
                  <p className="truncate text-sm text-text-secondary">
                    {[c.phone, c.vehicle_plate, c.device_model].filter(Boolean).join(" · ") || "—"}
                  </p>
                </button>
                <DeleteButton
                  confirmMessage={`"${c.name}" silinsin mi?`}
                  onDelete={() => deleteHizmetCustomer(createClient(), c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <HizmetMusteriDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        businessId={businessId}
        customer={editing}
      />
    </div>
  );
}
