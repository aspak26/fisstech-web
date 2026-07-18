"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowDown, ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { parseTRAmount } from "@/lib/utils/currency";
import type { UserDebtRow } from "@/lib/data/debts";

interface FormValues {
  personName: string;
  amount: string;
  date: string;
  dueDate: string;
  note: string;
}

export function DebtFormDialog({
  open,
  onClose,
  debt,
}: {
  open: boolean;
  onClose: () => void;
  debt?: UserDebtRow;
}) {
  const router = useRouter();
  // Initial-only: the parent remounts this dialog with a fresh `key` per
  // debt (see debts-list.tsx), so these never need to re-sync from props.
  const [type, setType] = useState<"borrowed" | "lent">(debt?.type ?? "borrowed");
  const [reminderActive, setReminderActive] = useState(debt?.is_reminder_active ?? false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    values: {
      personName: debt?.person_name ?? "",
      amount: debt ? String(debt.amount) : "",
      date: debt?.date ?? new Date().toISOString().slice(0, 10),
      dueDate: debt?.due_date ?? "",
      note: debt?.note ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const dueDate = reminderActive && values.dueDate ? values.dueDate : null;
      const payload = {
        type,
        person_name: values.personName,
        amount: parseTRAmount(values.amount),
        date: values.date,
        due_date: dueDate,
        is_reminder_active: reminderActive && !!dueDate,
        note: values.note,
      };

      if (debt) {
        await supabase.from("user_debts").update(payload).eq("id", debt.id);
      } else {
        await supabase.from("user_debts").insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          is_paid: false,
          ...payload,
        });
      }
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={debt ? "Borç Kaydını Düzenle" : "Yeni Borç Kaydı"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-control border border-border p-1">
          <button
            type="button"
            onClick={() => setType("borrowed")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-4px)] py-2.5 text-sm font-medium transition-colors",
              type === "borrowed" ? "bg-danger text-white" : "text-text-secondary",
            )}
          >
            <ArrowDown className="h-4 w-4" /> Borç Aldım
          </button>
          <button
            type="button"
            onClick={() => setType("lent")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-4px)] py-2.5 text-sm font-medium transition-colors",
              type === "lent" ? "bg-success text-white" : "text-text-secondary",
            )}
          >
            <ArrowUp className="h-4 w-4" /> Borç Verdim
          </button>
        </div>

        <div>
          <Label htmlFor="personName">{type === "borrowed" ? "Kimden?" : "Kime?"}</Label>
          <Input id="personName" {...register("personName", { required: true })} />
        </div>
        <div>
          <Label htmlFor="d-amount">Tutar</Label>
          <Input id="d-amount" inputMode="decimal" placeholder="₺" {...register("amount", { required: true })} />
        </div>
        <div>
          <Label htmlFor="d-date">Tarih</Label>
          <Input id="d-date" type="date" {...register("date")} />
        </div>
        <div>
          <Label htmlFor="d-note">Not (isteğe bağlı)</Label>
          <Input id="d-note" placeholder="Örn: Aliye olan döner borcum" {...register("note")} />
        </div>

        <div className="rounded-control border border-border p-3">
          <Switch checked={reminderActive} onChange={setReminderActive} label="Hatırlatıcı" />
          {reminderActive && (
            <div className="mt-3">
              <Label htmlFor="dueDate">Vade Tarihi</Label>
              <Input id="dueDate" type="date" {...register("dueDate", { required: reminderActive })} />
              <p className="mt-1 text-xs text-text-secondary">
                Vade yaklaştığında bu kayıt panoda vurgulanır. Tarayıcı bildirimleri bu sürümde henüz aktif değil.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className={type === "borrowed" ? "bg-danger hover:opacity-90" : "bg-success hover:opacity-90"}
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
