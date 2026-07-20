"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { addDebtPayment, getCustomerDebtHistory } from "@/lib/data/perakende";
import type { PerakendeCustomerRow, PerakendeDebtRow } from "@/lib/types/esnaf";

export function VeresiyeDetailDialog({
  open,
  onClose,
  businessId,
  customer,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customer: PerakendeCustomerRow;
  balance: number;
}) {
  const router = useRouter();
  const [history, setHistory] = useState<PerakendeDebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Parent remounts this dialog with a fresh `key` per customer (see
  // veresiye-list.tsx), so `loading`'s initial `true` value already covers
  // the "just opened for this customer" case without re-syncing here.
  useEffect(() => {
    getCustomerDebtHistory(createClient(), customer.id)
      .then(setHistory)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePayment() {
    const amount = Number(paymentAmount.replace(",", "."));
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await addDebtPayment(supabase, businessId, user.id, customer.id, amount, "Tahsilat");
      setPaymentAmount("");
      const refreshed = await getCustomerDebtHistory(supabase, customer.id);
      setHistory(refreshed);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={customer.name} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-control border border-border bg-bg p-3">
          <span className="text-sm text-text-secondary">Açık Bakiye</span>
          <span className={cn("font-display text-lg font-bold", balance > 0 ? "text-danger" : "text-success")}>
            {formatCurrency(Math.abs(balance))} {balance > 0 ? "borçlu" : ""}
          </span>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="payment-amount">Tahsilat Al</Label>
            <Input
              id="payment-amount"
              inputMode="decimal"
              placeholder="₺"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>
          <Button onClick={handlePayment} disabled={saving || !paymentAmount}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Hareketler</p>
          {loading ? (
            <p className="text-sm text-text-secondary">Yükleniyor…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-text-secondary">Henüz hareket yok</p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-text-primary">{h.description || (Number(h.amount) > 0 ? "Veresiye satış" : "Tahsilat")}</p>
                    <p className="text-text-secondary">{h.debt_date}</p>
                  </div>
                  <span className={cn("font-medium", Number(h.amount) > 0 ? "text-danger" : "text-success")}>
                    {Number(h.amount) > 0 ? "+" : ""}
                    {formatCurrency(Number(h.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
