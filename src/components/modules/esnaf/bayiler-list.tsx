"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteB2bCustomer } from "@/lib/data/toptan";
import type { B2bCustomerRow } from "@/lib/types/esnaf";
import { B2bCustomerDialog } from "./b2b-customer-dialog";
import { B2bCustomerDetailDialog } from "./b2b-customer-detail-dialog";

const RISK_TONE: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function BayilerList({ businessId, customers }: { businessId: string; customers: B2bCustomerRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<B2bCustomerRow | undefined>(undefined);
  const [selected, setSelected] = useState<B2bCustomerRow | null>(null);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Bayi Ekle
        </Button>
      </div>

      <Card>
        {customers.length === 0 ? (
          <EmptyState icon={Building2} title="Henüz bayi yok" />
        ) : (
          <ul className="divide-y divide-border">
            {customers.map((c) => {
              const isOverLimit = Number(c.current_debt) > Number(c.credit_limit) && Number(c.credit_limit) > 0;
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <button type="button" onClick={() => setSelected(c)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-text-primary">{c.company_name}</p>
                      <Badge tone={RISK_TONE[c.risk_level]}>{c.risk_level === "low" ? "Düşük" : c.risk_level === "medium" ? "Orta" : "Yüksek"}</Badge>
                      {isOverLimit && <Badge tone="danger">Limit Aşıldı</Badge>}
                    </div>
                    <p className="truncate text-sm text-text-secondary">{c.contact_name || c.phone || "—"}</p>
                  </button>
                  <span className={Number(c.current_debt) > 0 ? "font-medium text-danger" : "font-medium text-text-secondary"}>
                    {formatCurrency(Number(c.current_debt))}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setDialogOpen(true);
                    }}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Düzenle
                  </button>
                  <DeleteButton
                    confirmMessage={`"${c.company_name}" silinsin mi?`}
                    onDelete={() => deleteB2bCustomer(createClient(), c.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <B2bCustomerDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        businessId={businessId}
        customer={editing}
      />

      {selected && (
        <B2bCustomerDetailDialog
          key={selected.id}
          open={!!selected}
          onClose={() => setSelected(null)}
          businessId={businessId}
          customer={selected}
        />
      )}
    </div>
  );
}
