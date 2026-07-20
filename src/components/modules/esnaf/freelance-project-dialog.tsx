"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { createFreelanceClient, createFreelanceProject, type NewMilestone } from "@/lib/data/freelance";
import type { FreelanceClientRow } from "@/lib/types/esnaf";

interface MilestoneLine extends NewMilestone {
  key: string;
}

export function FreelanceProjectDialog({
  open,
  onClose,
  businessId,
  clients,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  clients: FreelanceClientRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [localClients, setLocalClients] = useState(clients);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [deadline, setDeadline] = useState("");

  const [paymentPlan, setPaymentPlan] = useState<"single" | "milestones">("single");
  const [milestones, setMilestones] = useState<MilestoneLine[]>([]);

  const budget = Number(totalBudget) || 0;
  const milestonesTotal = milestones.reduce((s, m) => s + m.amount, 0);
  const milestonesMismatch = paymentPlan === "milestones" && milestones.length > 0 && milestonesTotal !== budget;

  function reset() {
    setClientId(localClients[0]?.id ?? "");
    setShowQuickAdd(false);
    setQuickName("");
    setName("");
    setDescription("");
    setTotalBudget("");
    setHourlyRate("");
    setDeadline("");
    setPaymentPlan("single");
    setMilestones([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addMilestoneLine() {
    setMilestones((prev) => [...prev, { key: crypto.randomUUID(), name: "", amount: 0, dueDate: null }]);
  }

  function updateMilestoneLine(key: string, patch: Partial<MilestoneLine>) {
    setMilestones((prev) => prev.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  }

  function removeMilestoneLine(key: string) {
    setMilestones((prev) => prev.filter((m) => m.key !== key));
  }

  async function handleQuickAdd() {
    if (!quickName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const id = await createFreelanceClient(supabase, {
      businessId,
      userId: user.id,
      name: quickName.trim(),
      companyName: null,
      phone: null,
      email: null,
      taxId: null,
    });
    setLocalClients((prev) => [
      ...prev,
      {
        id,
        business_id: businessId,
        user_id: user.id,
        name: quickName.trim(),
        company_name: null,
        phone: null,
        email: null,
        address: null,
        tax_id: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    setClientId(id);
    setShowQuickAdd(false);
    setQuickName("");
  }

  async function handleSubmit() {
    if (!clientId || !name.trim()) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const finalMilestones: NewMilestone[] =
        paymentPlan === "single"
          ? [{ name: "Proje Bedeli", amount: budget, dueDate: deadline || null }]
          : milestones.filter((m) => m.name.trim() && m.amount > 0).map(({ name: n, amount, dueDate }) => ({ name: n, amount, dueDate }));

      await createFreelanceProject(supabase, {
        businessId,
        userId: user.id,
        clientId,
        name: name.trim(),
        description: description || null,
        totalBudget: budget,
        hourlyRate: Number(hourlyRate) || 0,
        deadline: deadline || null,
        milestones: finalMilestones,
      });
      handleClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Yeni Proje" className="max-w-lg">
      <div className="space-y-4">
        <div>
          <Label htmlFor="proj-client">Müşteri</Label>
          {localClients.length > 0 && !showQuickAdd && (
            <Select id="proj-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {localClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          {showQuickAdd ? (
            <div className="mt-2 flex items-end gap-2">
              <Input placeholder="Yeni müşteri adı" value={quickName} onChange={(e) => setQuickName(e.target.value)} autoFocus />
              <Button type="button" size="sm" disabled={!quickName.trim()} onClick={handleQuickAdd}>
                Ekle
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowQuickAdd(true)}
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" /> Yeni Müşteri Ekle
            </button>
          )}
        </div>

        <div>
          <Label htmlFor="proj-name">Proje Adı</Label>
          <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="proj-desc">Açıklama (isteğe bağlı)</Label>
          <Input id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="proj-budget">Bütçe</Label>
            <Input id="proj-budget" type="number" step="0.01" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="proj-rate">Saatlik Ücret</Label>
            <Input id="proj-rate" type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="proj-deadline">Teslim Tarihi</Label>
            <Input id="proj-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Ödeme Planı</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentPlan("single")}
              className={cn(
                "rounded-control border px-3 py-2.5 text-sm font-medium",
                paymentPlan === "single" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
              )}
            >
              Tek Seferlik Ödeme
            </button>
            <button
              type="button"
              onClick={() => setPaymentPlan("milestones")}
              className={cn(
                "rounded-control border px-3 py-2.5 text-sm font-medium",
                paymentPlan === "milestones" ? "border-accent bg-accent text-on-accent" : "border-border text-text-secondary",
              )}
            >
              Aşama Aşama Hakediş
            </button>
          </div>
        </div>

        {paymentPlan === "milestones" && (
          <div className="space-y-2">
            {milestones.map((m) => (
              <div key={m.key} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Aşama adı"
                  value={m.name}
                  onChange={(e) => updateMilestoneLine(m.key, { name: e.target.value })}
                />
                <Input
                  className="w-24"
                  type="number"
                  step="0.01"
                  placeholder="₺"
                  value={m.amount}
                  onChange={(e) => updateMilestoneLine(m.key, { amount: Number(e.target.value) })}
                />
                <Input
                  className="w-36"
                  type="date"
                  value={m.dueDate ?? ""}
                  onChange={(e) => updateMilestoneLine(m.key, { dueDate: e.target.value || null })}
                />
                <button
                  type="button"
                  aria-label="Aşamayı kaldır"
                  onClick={() => removeMilestoneLine(m.key)}
                  className="text-text-secondary hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addMilestoneLine} className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              <Plus className="h-3.5 w-3.5" /> Aşama ekle
            </button>
            <p className={cn("text-sm", milestonesMismatch ? "text-danger" : "text-text-secondary")}>
              Aşamalar toplamı: {formatCurrency(milestonesTotal)} {budget > 0 && `/ Bütçe: ${formatCurrency(budget)}`}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="button" disabled={saving || !clientId || !name.trim()} onClick={handleSubmit}>
            {saving ? "Kaydediliyor…" : "Projeyi Oluştur"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
