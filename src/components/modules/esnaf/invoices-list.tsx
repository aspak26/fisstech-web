"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteInvoice, markInvoicePaid } from "@/lib/data/esnaf";
import type { BusinessRow, InvoiceRow } from "@/lib/types/esnaf";
import { InvoiceFormDialog } from "./invoice-form-dialog";

const STATUS_LABEL: Record<string, string> = {
  bekliyor: "Bekliyor",
  odendi: "Ödendi",
  gecikti: "Gecikti",
};

export function InvoicesList({
  business,
  invoices,
}: {
  business: BusinessRow;
  invoices: InvoiceRow[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Fatura Ekle
        </Button>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState icon={FileText} title="Henüz fatura eklenmedi" />
        ) : (
          <ul className="divide-y divide-border">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-text-primary">
                      {inv.counterparty || "Fatura"}
                    </p>
                    <Badge tone={inv.invoice_type === "giden" ? "accent" : "neutral"}>
                      {inv.invoice_type === "giden" ? "Giden" : "Gelen"}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {inv.invoice_date}
                    {inv.due_date ? ` · Vade: ${inv.due_date}` : ""}
                  </p>
                </div>
                {inv.status !== "odendi" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await markInvoicePaid(createClient(), inv.id);
                      router.refresh();
                    }}
                  >
                    <Badge tone="neutral">{STATUS_LABEL[inv.status] ?? inv.status}</Badge>
                  </button>
                ) : (
                  <Badge tone="success">Ödendi</Badge>
                )}
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(inv.total_with_vat))}
                </span>
                <DeleteButton
                  confirmMessage="Bu fatura silinsin mi?"
                  onDelete={() => deleteInvoice(createClient(), inv.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <InvoiceFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} business={business} />
    </div>
  );
}
