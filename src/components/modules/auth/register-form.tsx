"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OAuthButtons } from "./oauth-buttons";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();
    // full_name is passed via options.data so the existing handle_new_user()
    // trigger picks it up — do NOT insert into public.users manually here.
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation is required by the project's auth settings.
      setConfirmationSent(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (confirmationSent) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          E-postanı kontrol et
        </h1>
        <p className="text-sm text-text-secondary">
          Hesabını doğrulamak için sana bir bağlantı gönderdik. Doğruladıktan sonra giriş
          yapabilirsin.
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
        <h1 className="font-display text-2xl font-semibold text-text-primary">Kayıt ol</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Fişştech Web hesabını oluştur — mobil uygulamanla aynı hesap.
        </p>
      </div>

      <div>
        <Label htmlFor="fullName">Ad Soyad</Label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName && (
          <p className="mt-1 text-sm text-danger">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Kayıt oluşturuluyor…" : "Kayıt ol"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Giriş yap
        </Link>
      </p>

      <OAuthButtons />
    </form>
  );
}
