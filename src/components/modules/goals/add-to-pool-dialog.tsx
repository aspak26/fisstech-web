"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { transferToPool } from "@/lib/data/goals";

/** Ported from mobile's goals_screen.dart _showAddToPoolDialog — net
 * bakiyeden birikim havuzuna aktarım, ardından ayrı bir adımda havuzdan
 * hedeflere dağıtılıyor. */
export function AddToPoolDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ amount: number }>({
    defaultValues: { amount: 0 },
  });

  async function onSubmit(values: { amount: number }) {
    if (!values.amount || Number(values.amount) <= 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await transferToPool(supabase, user.id, Number(values.amount));
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Havuza Para Ekle">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-text-secondary">
          Eklediğiniz tutar birikim havuzuna aktarılır. Buradan hedeflerinize dağıtabilirsiniz.
        </p>
        <div>
          <Label htmlFor="pool-amount">Tutar (₺)</Label>
          <Input id="pool-amount" type="number" step="0.01" autoFocus {...register("amount")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Ekleniyor…" : "Ekle"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
