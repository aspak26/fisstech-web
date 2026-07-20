"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { addB2bPayment, getB2bTransactions } from "@/lib/data/toptan";
import type { B2bCustomerRow, B2bTransactionRow } from "@/lib/types/esnaf";

const RISK_TONE: Record<string, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

const PAYMENT_TYPES = [
  { value: "nakit", label: "Nakit" },
  { value: "havale", label: "Havale/EFT" },
  { value: "cek", label: "Çek" },
];

export function B2bCustomerDetailDialog({
  open,
  onClose,
  businessId,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customer: B2bCustomerRow;
}) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<B2bTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"nakit" | "havale" | "cek">("nakit");
  const [referenceNo, setReferenceNo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getB2bTransactions(createClient(), customer.id)
      .then(setTransactions)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOverLimit = Number(customer.current_debt) > Number(customer.credit_limit) && Number(customer.credit_limit) > 0;

  async function handlePayment() {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await addB2bPayment(supabase, {
        businessId,
        userId: user.id,
        customer,
        amount: value,
        paymentType,
        referenceNo: paymentType === "cek" || paymentType === "havale" ? referenceNo || null : null,
        dueDate: paymentType === "cek" ? dueDate || null : null,
        notes: null,
      });
      setAmount("");
      setReferenceNo("");
      setDueDate("");
      const refreshed = await getB2bTransactions(supabase, customer.id);
      setTransactions(refreshed);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={customer.company_name} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-control border border-border bg-bg p-3">
          <div>
            <span className="text-sm text-text-secondary">Cari Bakiye</span>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge tone={RISK_TONE[customer.risk_level]}>{customer.risk_level === "low" ? "Düşük Risk" : customer.risk_level === "medium" ? "Orta Risk" : "Yüksek Risk"}</Badge>
              {isOverLimit && <Badge tone="danger">Limit Aşıldı</Badge>}
            </div>
          </div>
          <span className={cn("font-display text-lg font-bold", Number(customer.current_debt) > 0 ? "text-danger" : "text-success")}>
            {formatCurrency(Number(customer.current_debt))}
          </span>
        </div>

        <div className="space-y-2 rounded-control border border-border p-3">
          <Label>Tahsilat Kaydet</Label>
          <div className="flex gap-2">
            <Input inputMode="decimal" placeholder="₺" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1" />
            <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as typeof paymentType)} className="w-36">
              {PAYMENT_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          {(paymentType === "havale" || paymentType === "cek") && (
            <Input
              placeholder={paymentType === "cek" ? "Çek No" : "EFT/Havale No"}
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          )}
          {paymentType === "cek" && (
            <div>
              <Label htmlFor="cek-due" className="text-xs">
                Çek Vadesi
              </Label>
              <Input id="cek-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}
          <Button type="button" size="sm" className="w-full" disabled={saving || !amount} onClick={handlePayment}>
            {saving ? "Kaydediliyor…" : "Tahsilatı Kaydet"}
          </Button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Cari Hareketler</p>
          {loading ? (
            <p className="text-sm text-text-secondary">Yükleniyor…</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-text-secondary">Henüz hareket yok</p>
          ) : (
            <ul className="max-h-56 divide-y divide-border overflow-y-auto">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="text-text-primary">{t.description || (t.type === "borc" ? "Borç" : "Alacak")}</p>
                    <p className="text-text-secondary">{t.transaction_date}</p>
                  </div>
                  <span className={cn("font-medium", t.type === "borc" ? "text-danger" : "text-success")}>
                    {t.type === "borc" ? "+" : "-"}
                    {formatCurrency(Number(t.amount))}
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
