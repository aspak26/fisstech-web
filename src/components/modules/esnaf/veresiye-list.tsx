"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, HandCoins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { PerakendeCustomerRow } from "@/lib/types/esnaf";
import { PerakendeCustomerPickerDialog } from "./perakende-customer-picker-dialog";
import { VeresiyeDetailDialog } from "./veresiye-detail-dialog";

export function VeresiyeList({
  businessId,
  customers,
  balances,
}: {
  businessId: string;
  customers: PerakendeCustomerRow[];
  balances: [string, number][];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<PerakendeCustomerRow | null>(null);

  const balanceMap = useMemo(() => new Map(balances), [balances]);
  const totalOpen = balances.reduce((s, [, amount]) => s + Math.max(0, amount), 0);

  const rows = useMemo(
    () =>
      customers
        .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
        .map((c) => ({ customer: c, balance: balanceMap.get(c.id) ?? 0 }))
        .sort((a, b) => b.balance - a.balance),
    [customers, query, balanceMap],
  );

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between border-danger/30 bg-danger/5">
        <span className="text-sm text-text-secondary">Toplam Açık Hesap</span>
        <span className="font-display text-xl font-bold text-danger">{formatCurrency(totalOpen)}</span>
      </Card>

      <div className="flex items-center gap-3">
        <Input placeholder="Müşteri ara…" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
        <Button onClick={() => setAddOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" /> Müşteri Ekle
        </Button>
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={HandCoins} title="Henüz veresiye müşterisi yok" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(({ customer, balance }) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => setSelected(customer)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{customer.name}</p>
                    {customer.phone && <p className="text-sm text-text-secondary">{customer.phone}</p>}
                  </div>
                  <span className={cn("font-medium", balance > 0 ? "text-danger" : "text-text-secondary")}>
                    {balance > 0 ? formatCurrency(balance) : "Temiz"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PerakendeCustomerPickerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        businessId={businessId}
        customers={customers}
        onSelect={() => {
          setAddOpen(false);
          router.refresh();
        }}
      />

      {selected && (
        <VeresiyeDetailDialog
          key={selected.id}
          open={!!selected}
          onClose={() => setSelected(null)}
          businessId={businessId}
          customer={selected}
          balance={balanceMap.get(selected.id) ?? 0}
        />
      )}
    </div>
  );
}
