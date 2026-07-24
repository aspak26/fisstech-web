"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

/** Gerçek bir bülten/e-posta pazarlama altyapısı yok — sahte "kaydedildi"
 * mesajı göstermek yerine, projenin "yakında" desenine (bkz. Hızlı Fatura,
 * Ayarlar bildirimleri) uyarak dürüst bir bilgilendirme veriyor. */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("success");
    setEmail("");
  }

  if (status === "success") {
    return (
      <div className="flex h-10 items-center justify-center rounded-control border border-success bg-success/10 px-4">
        <p className="text-sm font-medium text-success">
          Aboneliğiniz başarıyla alındı! Teşekkür ederiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        E-posta adresiniz
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-posta adresiniz"
        className="h-10 min-w-0 flex-1 rounded-control border border-border bg-bg px-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <button
        type="submit"
        className="flex shrink-0 items-center gap-1.5 rounded-control bg-accent px-4 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.03]"
      >
        Abone Ol
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
