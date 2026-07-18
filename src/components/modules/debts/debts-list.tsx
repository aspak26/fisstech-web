"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteDebt, toggleDebtPaid, type UserDebtRow } from "@/lib/data/debts";
import { DebtFormDialog } from "./debt-form-dialog";

export function DebtsList({ debts }: { debts: UserDebtRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const borrowed = debts.filter((d) => d.type === "borrowed" && !d.is_paid);
  const lent = debts.filter((d) => d.type === "lent" && !d.is_paid);
  const totalBorrowed = borrowed.reduce((s, d) => s + Number(d.amount), 0);
  const totalLent = lent.reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-text-secondary">Toplam Borcum</p>
          <p className="font-display text-xl font-semibold text-danger">
            {formatCurrency(totalBorrowed)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Toplam Alacağım</p>
          <p className="font-display text-xl font-semibold text-success">
            {formatCurrency(totalLent)}
          </p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Borç/Alacak Ekle
        </Button>
      </div>

      <Card>
        {debts.length === 0 ? (
          <EmptyState icon={HandCoins} title="Henüz borç/alacak kaydı yok" />
        ) : (
          <ul className="divide-y divide-border">
            {debts.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-text-primary">{debt.person_name}</p>
                    <Badge tone={debt.type === "borrowed" ? "danger" : "success"}>
                      {debt.type === "borrowed" ? "Borç Aldım" : "Borç Verdim"}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {debt.date}
                    {debt.due_date ? ` · Vade: ${debt.due_date}` : ""}
                    {debt.note ? ` · ${debt.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleDebtPaid(createClient(), debt.id, !debt.is_paid);
                    router.refresh();
                  }}
                >
                  <Badge tone={debt.is_paid ? "success" : "neutral"}>
                    {debt.is_paid ? "Kapandı" : "Açık"}
                  </Badge>
                </button>
                <span className="font-medium text-text-primary">
                  {formatCurrency(Number(debt.amount))}
                </span>
                <DeleteButton
                  confirmMessage={`"${debt.person_name}" kaydı silinsin mi?`}
                  onDelete={() => deleteDebt(createClient(), debt.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <DebtFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
