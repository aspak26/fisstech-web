"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Bağlantı gönderildi
        </h1>
        <p className="text-sm text-text-secondary">
          E-postana şifre sıfırlama bağlantısı gönderdik.
        </p>
        <Link href="/login" className="inline-block text-sm text-accent hover:underline">
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Şifremi unuttum
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.
        </p>
      </div>

      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        <Link href="/login" className="text-accent hover:underline">
          Girişe dön
        </Link>
      </p>
    </form>
  );
}
