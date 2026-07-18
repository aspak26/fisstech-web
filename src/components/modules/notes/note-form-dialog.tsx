"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const COLORS: { value: "red" | "blue" | "green"; className: string }[] = [
  { value: "blue", className: "bg-accent" },
  { value: "green", className: "bg-success" },
  { value: "red", className: "bg-danger" },
];

interface FormValues {
  title: string;
  body: string;
}

export function NoteFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [color, setColor] = useState<"red" | "blue" | "green">("blue");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { title: "", body: "" },
  });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("user_notes").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        title: values.title,
        body: values.body,
        color,
      });
      reset();
      setColor("blue");
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Yeni Not">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="n-title">Başlık</Label>
          <Input id="n-title" {...register("title")} />
        </div>
        <div>
          <Label htmlFor="n-body">Not</Label>
          <textarea
            id="n-body"
            rows={4}
            className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            {...register("body")}
          />
        </div>
        <div>
          <Label>Renk</Label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-label={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface",
                  c.className,
                  color === c.value ? "ring-text-primary" : "ring-transparent",
                )}
              />
            ))}
          </div>
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
