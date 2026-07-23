"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { createAppointment, createHizmetCustomer, createServiceJob } from "@/lib/data/hizmet";
import type { EmployeeRow, HizmetCustomerRow, ServiceCatalogRow } from "@/lib/types/esnaf";

const PAYMENT_METHODS = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kart" },
  { value: "acik_hesap", label: "Açık Hesap" },
];

interface PartLine {
  id: string;
  partName: string;
  quantity: number;
  unitCost: number;
}

export function HizmetSihirbazDialog({
  open,
  onClose,
  businessId,
  customers,
  catalog,
  employees,
  preStartTime,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  customers: HizmetCustomerRow[];
  catalog: ServiceCatalogRow[];
  employees: EmployeeRow[];
  preStartTime?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [localCustomers, setLocalCustomers] = useState(customers);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [parts, setParts] = useState<PartLine[]>([]);

  const [staffId, setStaffId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("nakit");
  const [notes, setNotes] = useState("");

  const isAppointment = !!preStartTime;
  const filteredCustomers = useMemo(
    () => localCustomers.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [localCustomers, query],
  );
  const selectedCustomer = localCustomers.find((c) => c.id === customerId);
  const partsTotal = parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);
  const total = (Number(laborCost) || 0) + partsTotal;

  function reset() {
    setStep(0);
    setQuery("");
    setCustomerId(null);
    setShowQuickAdd(false);
    setQuickName("");
    setQuickPhone("");
    setSelectedServiceId(null);
    setCustomTitle("");
    setDeviceModel("");
    setVehiclePlate("");
    setLaborCost("0");
    setParts([]);
    setStaffId("");
    setPaymentMethod("nakit");
    setNotes("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function pickService(service: ServiceCatalogRow) {
    setSelectedServiceId(service.id);
    setLaborCost(String(service.default_price));
    if (!customTitle) setCustomTitle(service.name);
  }

  function addPart() {
    setParts((prev) => [...prev, { id: crypto.randomUUID(), partName: "", quantity: 1, unitCost: 0 }]);
  }

  function updatePart(id: string, patch: Partial<PartLine>) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePart(id: string) {
    setParts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleQuickAdd() {
    if (!quickName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const id = await createHizmetCustomer(supabase, {
      businessId,
      userId: user.id,
      name: quickName.trim(),
      phone: quickPhone || null,
      notes: null,
      vehiclePlate: null,
      deviceModel: null,
    });
    setLocalCustomers((prev) => [...prev, { id, business_id: businessId, user_id: user.id, name: quickName.trim(), phone: quickPhone || null, notes: null, vehicle_plate: null, device_model: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    setCustomerId(id);
    setShowQuickAdd(false);
    setQuickName("");
    setQuickPhone("");
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isAppointment) {
        const service = catalog.find((s) => s.id === selectedServiceId);
        const start = new Date(preStartTime!);
        const end = new Date(start.getTime() + (service?.duration_minutes ?? 30) * 60000);
        await createAppointment(supabase, {
          businessId,
          userId: user.id,
          customerId,
          staffId: staffId || null,
          serviceCatalogId: selectedServiceId,
          start: start.toISOString(),
          end: end.toISOString(),
          notes: notes || null,
        });
      } else {
        const service = catalog.find((s) => s.id === selectedServiceId);
        await createServiceJob(supabase, {
          businessId,
          userId: user.id,
          customerId,
          staffId: staffId || null,
          title: customTitle.trim() || service?.name || "Manuel İş",
          deviceModel: deviceModel.trim() || null,
          vehiclePlate: vehiclePlate.trim().toUpperCase() || null,
          laborCost: Number(laborCost) || 0,
          paymentMethod,
          parts: parts.filter((p) => p.partName.trim()).map((p) => ({ partName: p.partName, quantity: p.quantity, unitCost: p.unitCost })),
          notes: notes || null,
        });
      }
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title={isAppointment ? "Randevu Oluştur" : "Yeni İş"} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-bg")} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <Input placeholder="Müşteri ara…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCustomerId(c.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-control px-3 py-2.5 text-left",
                    customerId === c.id ? "bg-accent/10 text-accent" : "hover:bg-bg text-text-primary",
                  )}
                >
                  <span>{c.name}</span>
                  {c.phone && <span className="text-sm text-text-secondary">{c.phone}</span>}
                </button>
              ))}
            </div>

            {showQuickAdd ? (
              <div className="space-y-2 rounded-control border border-border p-3">
                <Input placeholder="Ad Soyad" value={quickName} onChange={(e) => setQuickName(e.target.value)} autoFocus />
                <Input placeholder="Telefon (isteğe bağlı)" value={quickPhone} onChange={(e) => setQuickPhone(e.target.value)} />
                <Button type="button" size="sm" className="w-full" disabled={!quickName.trim()} onClick={handleQuickAdd}>
                  Ekle ve Seç
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-border py-2.5 text-sm font-medium text-accent hover:border-accent"
              >
                <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setCustomerId(null);
                setStep(1);
              }}
              className="w-full text-center text-sm font-medium text-text-secondary hover:text-accent"
            >
              Müşterisiz devam et →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {selectedCustomer && (
              <p className="text-sm text-text-secondary">
                Müşteri: <span className="font-medium text-text-primary">{selectedCustomer.name}</span>
              </p>
            )}
            {catalog.length > 0 && (
              <div>
                <Label>Hizmet Kataloğu</Label>
                <div className="flex flex-wrap gap-2">
                  {catalog.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickService(s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium",
                        selectedServiceId === s.id
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border text-text-secondary hover:border-accent",
                      )}
                    >
                      {s.name} · {formatCurrency(Number(s.default_price))}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3 rounded-control border border-border p-3">
              <div>
                <Label htmlFor="custom-title">Özel Hizmet / Cihaz Adı (opsiyonel)</Label>
                <Input id="custom-title" placeholder="Farklı bir hizmet adı girin..." value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="device-model">Cihaz Modeli</Label>
                  <Input id="device-model" placeholder="Örn: iPhone 16" value={deviceModel} onChange={(e) => setDeviceModel(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label htmlFor="vehicle-plate">Araç Plakası</Label>
                  <Input id="vehicle-plate" placeholder="Örn: 34ABC123" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="uppercase" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="labor-cost">İşçilik Ücreti</Label>
              <Input id="labor-cost" type="number" step="0.01" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="mb-0">Parçalar</Label>
                <button type="button" onClick={addPart} className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Parça ekle
                </button>
              </div>
              <div className="space-y-2">
                {parts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Parça adı"
                      value={p.partName}
                      onChange={(e) => updatePart(p.id, { partName: e.target.value })}
                    />
                    <Input
                      className="w-16"
                      type="number"
                      step="1"
                      value={p.quantity}
                      onChange={(e) => updatePart(p.id, { quantity: Number(e.target.value) })}
                    />
                    <Input
                      className="w-24"
                      type="number"
                      step="0.01"
                      placeholder="Birim ₺"
                      value={p.unitCost}
                      onChange={(e) => updatePart(p.id, { unitCost: Number(e.target.value) })}
                    />
                    <button
                      type="button"
                      aria-label="Parçayı kaldır"
                      onClick={() => removePart(p.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm font-medium text-text-primary">
              Toplam: <span className="text-accent">{formatCurrency(total)}</span>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {employees.length > 0 && (
              <div>
                <Label htmlFor="staff">Personel (isteğe bağlı)</Label>
                <Select id="staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                  <option value="">Seçilmedi</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.full_name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {!isAppointment && (
              <div>
                <Label htmlFor="payment">Ödeme Yöntemi</Label>
                <Select id="payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="wiz-notes">Not (isteğe bağlı)</Label>
              <Input id="wiz-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
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
            <Button type="button" size="sm" onClick={() => setStep((s) => s + 1)} className="gap-1">
              İleri <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" size="sm" disabled={saving} onClick={handleSubmit}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
