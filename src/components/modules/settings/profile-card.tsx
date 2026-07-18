"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const PLAN_LABELS: Record<string, string> = {
  free: "Ücretsiz",
  premium: "Premium",
  family: "Aile",
  esnaf_premium: "Esnaf Premium",
};

export function ProfileCard({
  name,
  email,
  planType,
}: {
  name: string;
  email: string;
  planType: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit } = useForm<{ name: string }>({ defaultValues: { name } });

  async function onSubmit(values: { name: string }) {
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("users").update({ name: values.name }).eq("id", user.id);
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={name || email} className="h-12 w-12 text-base" />
        <div>
          <p className="font-medium text-text-primary">{name || "İsimsiz kullanıcı"}</p>
          <p className="text-sm text-text-secondary">{email}</p>
          <Badge tone="accent" className="mt-1">
            {PLAN_LABELS[planType] ?? planType}
          </Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="profile-name">Ad Soyad</Label>
          <Input id="profile-name" {...register("name")} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </form>
      {saved && <p className="mt-2 text-sm text-success">Profil güncellendi.</p>}
    </Card>
  );
}
