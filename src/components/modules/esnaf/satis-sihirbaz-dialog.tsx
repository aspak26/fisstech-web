"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, UserPlus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { createSaleCustomer, createSaleTransaction } from "@/lib/data/satis";
import { downloadSaleReceipt } from "@/lib/esnaf/sale-receipt-pdf";
import { PORTFOLIO_CATEGORIES, type EmployeeRow, type SaleCustomerRow, type SalePortfolioRow } from "@/lib/types/esnaf";

const INSTALLMENT_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

export function SatisSihirbazDialog({
  open,
  onClose,
  businessId,
  businessName,
  customers,
  portfolios,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  customers: SaleCustomerRow[];
  portfolios: SalePortfolioRow[];
  employees: EmployeeRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [localCustomers, setLocalCustomers] = useState(customers);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");

  const [itemQuery, setItemQuery] = useState("");
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const [totalAmount, setTotalAmount] = useState("");
  const [downPayment, setDownPayment] = useState("0");
  const [paymentType, setPaymentType] = useState<"tek_cekim" | "taksitli">("tek_cekim");
  const [installmentCount, setInstallmentCount] = useState(12);
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(new Date().toISOString().slice(0, 10));
  const [staffId, setStaffId] = useState("");

  const availablePortfolios = useMemo(
    () => portfolios.filter((p) => p.status !== "satildi" && p.title.toLowerCase().includes(itemQuery.trim().toLowerCase())),
    [portfolios, itemQuery],
  );
  const filteredCustomers = useMemo(
    () => localCustomers.filter((c) => c.full_name.toLowerCase().includes(customerQuery.trim().toLowerCase())),
    [localCustomers, customerQuery],
  );
  const selectedPortfolio = portfolios.find((p) => p.id === portfolioId);
  const selectedCustomer = localCustomers.find((c) => c.id === customerId);
  const itemTitle = manualMode ? manualTitle : (selectedPortfolio?.title ?? "");
  const total = Number(totalAmount) || 0;
  const remaining = total - (Number(downPayment) || 0);

  function reset() {
    setStep(0);
    setCustomerQuery("");
    setCustomerId(null);
    setIsGuest(false);
    setShowQuickAdd(false);
    setQuickName("");
    setItemQuery("");
    setPortfolioId(null);
    setManualMode(false);
    setManualTitle("");
    setManualPrice("");
    setTotalAmount("");
    setDownPayment("0");
    setPaymentType("tek_cekim");
    setInstallmentCount(12);
    setFirstInstallmentDate(new Date().toISOString().slice(0, 10));
    setStaffId("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pickPortfolio(item: SalePortfolioRow) {
    setPortfolioId(item.id);
    setManualMode(false);
    setTotalAmount(String(item.list_price));
  }

  function pickManual() {
    setManualMode(true);
    setPortfolioId(null);
    if (manualPrice) setTotalAmount(manualPrice);
  }

  async function handleQuickAddCustomer() {
    if (!quickName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const id = await createSaleCustomer(supabase, { businessId, userId: user.id, fullName: quickName.trim(), phone: null, tcOrVat: null });
    setLocalCustomers((prev) => [
      ...prev,
      {
        id,
        business_id: businessId,
        user_id: user.id,
        full_name: quickName.trim(),
        phone: null,
        email: null,
        tc_or_vat: null,
        address: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    setCustomerId(id);
    setIsGuest(false);
    setShowQuickAdd(false);
    setQuickName("");
  }

  async function handleSubmit() {
    if (!total || (!manualMode && !portfolioId && !manualTitle)) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const result = await createSaleTransaction(supabase, {
        businessId,
        userId: user.id,
        customerId: isGuest ? null : customerId,
        portfolioItemId: manualMode ? null : portfolioId,
        staffEmployeeId: staffId || null,
        totalAmount: total,
        downPayment: Number(downPayment) || 0,
        paymentType,
        installmentCount,
        firstInstallmentDate: paymentType === "taksitli" ? firstInstallmentDate : null,
        notes: null,
      });

      downloadSaleReceipt({
        businessName,
        customerName: isGuest ? "Misafir Müşteri" : (selectedCustomer?.full_name ?? "—"),
        itemTitle: itemTitle || "—",
        totalAmount: total,
        downPayment: Number(downPayment) || 0,
        paymentType,
        installments: result.installments,
        saleDate: new Date().toISOString().slice(0, 10),
        staffName: employees.find((e) => e.id === staffId)?.full_name ?? null,
      });

      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canProceedStep0 = isGuest || !!customerId;
  const canProceedStep1 = manualMode ? !!manualTitle.trim() && !!manualPrice : !!portfolioId;

  return (
    <Dialog open={open} onClose={handleClose} title="Satış Yap" className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-bg")} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <Input placeholder="Müşteri ara…" value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomerId(c.id);
                    setIsGuest(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left",
                    customerId === c.id && !isGuest ? "bg-accent/10 text-accent" : "hover:bg-bg text-text-primary",
                  )}
                >
                  <span>{c.full_name}</span>
                  {c.phone && <span className="text-sm text-text-secondary">{c.phone}</span>}
                </button>
              ))}
            </div>

            {showQuickAdd ? (
              <div className="flex items-end gap-2">
                <Input placeholder="Ad Soyad" value={quickName} onChange={(e) => setQuickName(e.target.value)} autoFocus />
                <Button type="button" size="sm" disabled={!quickName.trim()} onClick={handleQuickAddCustomer}>
                  Ekle
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowQuickAdd(true)} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                <UserPlus className="h-3.5 w-3.5" /> Yeni Müşteri Ekle
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsGuest(true);
                setCustomerId(null);
              }}
              className={cn(
                "w-full rounded-control border py-2.5 text-center text-sm font-medium",
                isGuest ? "border-accent bg-accent/10 text-accent" : "border-dashed border-border text-text-secondary hover:border-accent",
              )}
            >
              Misafir Müşteri ile Devam Et
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-text-secondary" />
              <Input placeholder="Portföyde ara…" value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} className="flex-1" />
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {availablePortfolios.map((p) => {
                const category = PORTFOLIO_CATEGORIES.find((c) => c.value === p.category);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPortfolio(p)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left",
                      portfolioId === p.id ? "bg-accent/10 text-accent" : "hover:bg-bg text-text-primary",
                    )}
                  >
                    <span>
                      {category?.emoji} {p.title}
                    </span>
                    <span className="text-sm text-text-secondary">{formatCurrency(Number(p.list_price))}</span>
                  </button>
                );
              })}
            </div>

            <div className={cn("rounded-control border p-3", manualMode ? "border-accent" : "border-border")}>
              <button type="button" onClick={pickManual} className="text-sm font-medium text-accent hover:underline">
                Manuel / Özel Ürün Gir
              </button>
              {manualMode && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input placeholder="Ürün adı" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="₺"
                    value={manualPrice}
                    onChange={(e) => {
                      setManualPrice(e.target.value);
                      setTotalAmount(e.target.value);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wiz-total">Toplam Tutar</Label>
                <Input id="wiz-total" type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="wiz-down">Kapora / Peşinat</Label>
                <Input id="wiz-down" type="number" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Ödeme Türü</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType("tek_cekim")}
                  className={cn(
                    "rounded-control border px-3 py-2.5 text-sm font-medium",
                    paymentType === "tek_cekim" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                  )}
                >
                  Tek Çekim
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("taksitli")}
                  className={cn(
                    "rounded-control border px-3 py-2.5 text-sm font-medium",
                    paymentType === "taksitli" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                  )}
                >
                  Taksitli
                </button>
              </div>
            </div>

            {paymentType === "taksitli" && (
              <div className="space-y-3">
                <div>
                  <Label>Taksit Sayısı</Label>
                  <div className="flex flex-wrap gap-2">
                    {INSTALLMENT_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setInstallmentCount(n)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-medium",
                          installmentCount === n ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="wiz-first-installment">İlk Taksit Tarihi</Label>
                  <Input id="wiz-first-installment" type="date" value={firstInstallmentDate} onChange={(e) => setFirstInstallmentDate(e.target.value)} />
                </div>
                {remaining > 0 && (
                  <p className="text-sm text-text-secondary">
                    Aylık taksit: <span className="font-medium text-text-primary">{formatCurrency(remaining / installmentCount)}</span>
                  </p>
                )}
              </div>
            )}

            {employees.length > 0 && (
              <div>
                <Label htmlFor="wiz-staff">Satışı Yapan (isteğe bağlı)</Label>
                <Select id="wiz-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                  <option value="">Seçilmedi</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <p className="text-sm font-medium text-text-primary">
              Toplam: <span className="text-accent">{formatCurrency(total)}</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Geri
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              size="sm"
              disabled={(step === 0 && !canProceedStep0) || (step === 1 && !canProceedStep1)}
              onClick={() => setStep((s) => s + 1)}
              className="gap-1"
            >
              İleri <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={saving || !total} onClick={handleSubmit}>
              {saving ? "Kaydediliyor…" : "Satışı Tamamla ve Makbuz İndir"}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
