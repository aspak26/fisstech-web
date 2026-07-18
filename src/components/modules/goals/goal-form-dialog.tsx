"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

interface FormValues {
  name: string;
  emoji: string;
  targetAmount: number;
}

export function GoalFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { name: "", emoji: "🎯", targetAmount: 0 },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("goals").insert({
        user_id: user.id,
        name: values.name,
        emoji: values.emoji || "🎯",
        target_amount: Number(values.targetAmount),
      });
      reset();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Yeni Hedef">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-3">
          <div className="w-20">
            <Label htmlFor="emoji">Emoji</Label>
            <Input id="emoji" {...register("emoji")} />
          </div>
          <div className="flex-1">
            <Label htmlFor="g-name">Hedef Adı</Label>
            <Input id="g-name" placeholder="Araba, Tatil..." {...register("name", { required: true })} />
          </div>
        </div>
        <div>
          <Label htmlFor="targetAmount">Hedef Tutar</Label>
          <Input id="targetAmount" type="number" step="0.01" {...register("targetAmount")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            İptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
