"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, CalendarClock, CheckCircle2, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { markInstallmentPaid } from "@/lib/data/satis";
import { PORTFOLIO_CATEGORIES } from "@/lib/types/esnaf";
import type {
  EmployeeRow,
  SaleCustomerRow,
  SaleInstallmentRow,
  SalePortfolioRow,
  SaleTransactionRow,
} from "@/lib/types/esnaf";
import { SatisSihirbazDialog } from "./satis-sihirbaz-dialog";

export function SatisSurecler({
  businessId,
  businessName,
  transactions,
  installments,
  portfolios,
  customers,
  employees,
}: {
  businessId: string;
  businessName: string;
  transactions: SaleTransactionRow[];
  installments: SaleInstallmentRow[];
  portfolios: SalePortfolioRow[];
  customers: SaleCustomerRow[];
  employees: EmployeeRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"kaporali" | "taksit" | "tamamlanan">("taksit");
  const [wizardOpen, setWizardOpen] = useState(false);

  const portfolioMap = new Map(portfolios.map((p) => [p.id, p]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const transactionMap = new Map(transactions.map((t) => [t.id, t]));

  const reserved = portfolios.filter((p) => p.status === "rezerve");
  const unpaidInstallments = useMemo(
    () => installments.filter((i) => !i.is_paid).sort((a, b) => (a.due_date < b.due_date ? -1 : 1)),
    [installments],
  );

  const completedTransactions = useMemo(() => {
    const installmentsByTransaction = new Map<string, SaleInstallmentRow[]>();
    for (const inst of installments) {
      const list = installmentsByTransaction.get(inst.transaction_id) ?? [];
      list.push(inst);
      installmentsByTransaction.set(inst.transaction_id, list);
    }
    return transactions.filter((t) => {
      if (t.payment_type === "tek_cekim") return true;
      const list = installmentsByTransaction.get(t.id) ?? [];
      return list.length > 0 && list.every((i) => i.is_paid);
    });
  }, [transactions, installments]);

  async function handleMarkPaid(installment: SaleInstallmentRow) {
    await markInstallmentPaid(createClient(), installment);
    router.refresh();
  }

  function handleAttachDocument() {
    window.alert("Evrak yükleme yakında aktif olacak");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          options={[
            { value: "kaporali", label: `Kaporalı (${reserved.length})` },
            { value: "taksit", label: `Taksit (${unpaidInstallments.length})` },
            { value: "tamamlanan", label: `Tamamlanan (${completedTransactions.length})` },
          ]}
        />
        <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Satış Yap
        </Button>
      </div>

      {tab === "kaporali" && (
        <Card>
          {reserved.length === 0 ? (
            <EmptyState icon={Clock} title="Rezerve edilmiş portföy yok" />
          ) : (
            <ul className="divide-y divide-border">
              {reserved.map((item) => {
                const category = PORTFOLIO_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="text-text-primary">
                      {category?.emoji} {item.title}
                    </p>
                    <span className="font-medium text-text-primary">{formatCurrency(Number(item.list_price))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === "taksit" && (
        <Card>
          {unpaidInstallments.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Bekleyen taksit yok" />
          ) : (
            <ul className="divide-y divide-border">
              {unpaidInstallments.map((inst) => {
                const transaction = transactionMap.get(inst.transaction_id);
                const customer = transaction?.customer_id ? customerMap.get(transaction.customer_id) : null;
                const isOverdue = inst.due_date < new Date().toISOString().slice(0, 10);
                return (
                  <li key={inst.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-text-primary">{customer?.full_name ?? "Misafir Müşteri"}</p>
                        <Badge tone={isOverdue ? "danger" : "neutral"}>{inst.installment_no}. Taksit</Badge>
                        {isOverdue && <Badge tone="danger">Gecikti</Badge>}
                      </div>
                      <p className="text-sm text-text-secondary">Vade: {inst.due_date}</p>
                    </div>
                    <span className="font-medium text-text-primary">{formatCurrency(Number(inst.amount))}</span>
                    <button
                      type="button"
                      onClick={handleAttachDocument}
                      aria-label="Evrak Yükle"
                      className="flex h-8 w-8 items-center justify-center rounded-control text-text-secondary hover:bg-bg"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <Button variant="secondary" size="sm" onClick={() => handleMarkPaid(inst)}>
                      Ödendi
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === "tamamlanan" && (
        <Card>
          {completedTransactions.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Tamamlanan satış yok" />
          ) : (
            <ul className="divide-y divide-border">
              {completedTransactions.map((t) => {
                const customer = t.customer_id ? customerMap.get(t.customer_id) : null;
                const portfolioItem = t.portfolio_item_id ? portfolioMap.get(t.portfolio_item_id) : null;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-text-primary">{customer?.full_name ?? "Misafir Müşteri"}</p>
                      <p className={cn("truncate text-sm text-text-secondary")}>
                        {portfolioItem?.title ?? "Manuel ürün"} · {t.sale_date}
                      </p>
                    </div>
                    <span className="font-medium text-success">{formatCurrency(Number(t.total_amount))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      <SatisSihirbazDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        businessId={businessId}
        businessName={businessName}
        customers={customers}
        portfolios={portfolios}
        employees={employees}
      />
    </div>
  );
}
