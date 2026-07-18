"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { contributeToGoal, type GoalRow } from "@/lib/data/goals";

export function ContributeDialog({
  goal,
  onClose,
}: {
  goal: GoalRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ amount: number }>({
    defaultValues: { amount: 0 },
  });

  async function onSubmit(values: { amount: number }) {
    if (!goal || !values.amount) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await contributeToGoal(supabase, user.id, goal, Number(values.amount));
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!goal} onClose={onClose} title={`${goal?.emoji ?? ""} ${goal?.name ?? ""} — Para Ekle`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="c-amount">Eklenecek Tutar</Label>
          <Input id="c-amount" type="number" step="0.01" autoFocus {...register("amount")} />
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
