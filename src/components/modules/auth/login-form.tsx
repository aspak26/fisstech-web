"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OAuthButtons } from "./oauth-buttons";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      // "Invalid login credentials" tek bir Supabase hatası ama en az iki
      // farklı gerçek nedeni kapsıyor: gerçekten yanlış şifre, VEYA hesap
      // Google ile oluşturulmuş ve hiç şifresi yok (auth.users'ta password
      // credential'ı yok). Supabase bu ikisini güvenlik gereği (hesap
      // enumeration'ı önlemek için) tek bir genel mesajla dönüyor, ayırt
      // etmiyor — bunu ayırt etmek servis-role anahtarlı bir admin sorgusu
      // gerektirirdi (bu projede web tarafında henüz kurulu değil). Bunun
      // yerine, gerçekten yanlış şifreyi giren kullanıcıyı yanlış yönlendirmeden,
      // Google hesabıyla karışan kullanıcıya da çıkış yolu gösteren tek bir
      // ipucu ekleniyor.
      setServerError(
        error.message === "Invalid login credentials"
          ? "E-posta veya şifre hatalı. Bu hesabı Google ile oluşturduysanız “Google ile Giriş Yap”ı kullanın ya da “Şifremi Unuttum” ile yeni bir şifre belirleyin."
          : error.message,
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Giriş yap</h1>
        <p className="mt-1 text-sm text-text-secondary">Fişştech hesabına giriş yap.</p>
      </div>

      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Şifre</Label>
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Şifremi unuttum
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Hesabın yok mu?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Kayıt ol
        </Link>
      </p>

      <OAuthButtons />
    </form>
  );
}
