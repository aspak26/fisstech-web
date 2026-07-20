"use client";

import { useState } from "react";
import { Plus, Contact } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteFreelanceClient } from "@/lib/data/freelance";
import type { FreelanceClientRow } from "@/lib/types/esnaf";
import { FreelanceMusteriDialog } from "./freelance-musteri-dialog";

export function FreelanceMusteriList({ businessId, clients }: { businessId: string; clients: FreelanceClientRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FreelanceClientRow | undefined>(undefined);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(client: FreelanceClientRow) {
    setEditing(client);
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
        {clients.length === 0 ? (
          <EmptyState icon={Contact} title="Henüz müşteri yok" />
        ) : (
          <ul className="divide-y divide-border">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <button type="button" onClick={() => openEdit(c)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-text-primary">{c.name}</p>
                  <p className="truncate text-sm text-text-secondary">
                    {[c.company_name, c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </button>
                <DeleteButton
                  confirmMessage={`"${c.name}" silinsin mi?`}
                  onDelete={() => deleteFreelanceClient(createClient(), c.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <FreelanceMusteriDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        businessId={businessId}
        client={editing}
      />
    </div>
  );
}
