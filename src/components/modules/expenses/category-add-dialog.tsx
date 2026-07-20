"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { createCategory } from "@/lib/data/categories";
import type { CategoriesRow } from "@/lib/types/database";

interface FormValues {
  name: string;
  parentGroup: string;
  icon: string;
}

/** Ported from mobile's CategoryPickerSheet "Yeni" add-category dialog —
 * rendered inline (not as a nested Dialog) to avoid two overlapping focus
 * traps fighting over Escape/Tab when opened from inside another Dialog. */
export function CategoryAddInline({
  groups,
  defaultGroup,
  onCreated,
  onCancel,
}: {
  groups: string[];
  defaultGroup: string;
  onCreated: (category: CategoriesRow) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: "", parentGroup: defaultGroup, icon: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!values.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const category = await createCategory(supabase, user.id, {
        name: values.name,
        parentGroup: values.parentGroup,
        icon: values.icon,
      });
      onCreated(category);
    } catch {
      setError("Eklenemedi, lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 rounded-control border border-border p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <Label htmlFor="cat-name" className="text-xs">
            Kategori Adı
          </Label>
          <Input id="cat-name" className="h-9" {...register("name", { required: true })} autoFocus />
        </div>
        <div>
          <Label htmlFor="cat-group" className="text-xs">
            Grup
          </Label>
          <Select id="cat-group" className="h-9" {...register("parentGroup")}>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cat-icon" className="text-xs">
            Emoji (opsiyonel)
          </Label>
          <Input id="cat-icon" className="h-9" placeholder="📦" {...register("icon")} />
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Ekleniyor…" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}
