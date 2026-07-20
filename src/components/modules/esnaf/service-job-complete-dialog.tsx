"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { completeServiceJob } from "@/lib/data/hizmet";
import type { EmployeeRow, ServiceJobRow } from "@/lib/types/esnaf";

const PAYMENT_OPTIONS = [
  { value: "nakit", label: "Nakit" },
  { value: "kart", label: "Kart" },
  { value: "acik_hesap", label: "Açık Hesap (Ödeme Alınmadı)" },
];

/** Ported from mobile's atolye_screen.dart _showCompletionDialog — shown
 * when moving a job to "Tamamlandı": optionally finalize an open-tab
 * payment, assign the staff member who did the work, and record their
 * commission (%). */
export function ServiceJobCompleteDialog({
  job,
  businessId,
  employees,
  onClose,
  onCompleted,
}: {
  job: ServiceJobRow | null;
  businessId: string;
  employees: EmployeeRow[];
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [staffId, setStaffId] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("nakit");
  const [saving, setSaving] = useState(false);

  function handleClose() {
    setStaffId("");
    setCommissionRate("");
    setPaymentMethod("nakit");
    onClose();
  }

  async function handleConfirm() {
    if (!job) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await completeServiceJob(supabase, businessId, user.id, job, {
        staffId: staffId || null,
        commissionRate: Number(commissionRate.replace(",", ".")) || 0,
        paymentMethod: job.payment_method === "acik_hesap" ? paymentMethod : job.payment_method,
      });
      handleClose();
      onCompleted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!job} onClose={handleClose} title="İşlemi Tamamla & Ödeme Al">
      <div className="space-y-4">
        {job?.payment_method === "acik_hesap" && (
          <div>
            <Label htmlFor="complete-payment">Ödeme Yöntemi</Label>
            <Select id="complete-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="complete-staff">İşlemi Yapan Personel</Label>
          <Select id="complete-staff" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Personel Seçilmedi</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </Select>
        </div>
        {staffId && (
          <div>
            <Label htmlFor="complete-commission">Prim Oranı (%)</Label>
            <Input
              id="complete-commission"
              type="number"
              step="0.1"
              placeholder="0"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
            İptal
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving}>
            {saving ? "Kaydediliyor…" : "Tamamla & Kaydet"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
