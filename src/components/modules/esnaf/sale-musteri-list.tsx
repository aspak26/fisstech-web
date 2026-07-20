"use client";

import { useState } from "react";
import { Plus, Contact } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteSaleCustomer } from "@/lib/data/satis";
import type { SaleCustomerRow } from "@/lib/types/esnaf";
import { SaleMusteriDialog } from "./sale-musteri-dialog";

export function SaleMusteriList({ businessId, customers }: { businessId: string; customers: SaleCustomerRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
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
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{c.full_name}</p>
                  <p className="truncate text-sm text-text-secondary">{[c.phone, c.tc_or_vat].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <DeleteButton
                  confirmMessage={`"${c.full_name}" silinsin mi?`}
                  onDelete={() => deleteSaleCustomer(createClient(), c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SaleMusteriDialog open={dialogOpen} onClose={() => setDialogOpen(false)} businessId={businessId} />
    </div>
  );
}
