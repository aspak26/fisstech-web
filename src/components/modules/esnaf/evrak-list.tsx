"use client";

import { useState } from "react";
import { Plus, FolderOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteInvoice } from "@/lib/data/esnaf";
import type { BusinessRow, InvoiceRow } from "@/lib/types/esnaf";
import { EvrakUploadDialog } from "./evrak-upload-dialog";

export function EvrakList({
  business,
  invoices,
}: {
  business: BusinessRow;
  invoices: InvoiceRow[];
}) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Taranan belgeler otomatik olarak fatura kaydı oluşturur — Faturalar sayfasında da görünür.
        </p>
        <Button onClick={() => setUploadOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" /> Evrak Tara
        </Button>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Henüz taranmış evrak yok"
            description="Fatura, makbuz veya sözleşme gibi belgeleri toplu şekilde tarayabilirsin."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-control border border-border p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {inv.counterparty || "Belge"}
                    </p>
                    <p className="text-sm text-text-secondary">{inv.invoice_date}</p>
                  </div>
                  <Badge tone={inv.invoice_type === "giden" ? "accent" : "neutral"}>
                    {inv.invoice_type === "giden" ? "Giden" : "Gelen"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">
                    {formatCurrency(Number(inv.total_with_vat))}
                  </span>
                  <div className="flex items-center gap-1">
                    {inv.image_url && (
                      <a
                        href={inv.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-control text-text-secondary hover:bg-bg"
                        aria-label="Belgeyi görüntüle"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <DeleteButton
                      confirmMessage="Bu evrak/fatura silinsin mi?"
                      onDelete={() => deleteInvoice(createClient(), inv.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EvrakUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} business={business} />
    </div>
  );
}
