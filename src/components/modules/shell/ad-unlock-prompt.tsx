"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

/** Ücretsiz kullanıcı, web'de reklam SDK'sı olmadığı için reklam ödülünü
 * mobil uygulamadan kazanır — kazandığı hak burada da (aynı feature_unlocks
 * tablosu üzerinden) geçerli olur. "Tekrar Dene" reklamı izleyip web
 * sekmesine dönen kullanıcı için sayfayı yeniden kontrol ettirir. */
export function AdUnlockPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  function retry() {
    setChecking(true);
    router.refresh();
    setTimeout(() => setChecking(false), 1500);
  }

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-10">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Smartphone className="h-7 w-7 text-accent" />
        </div>
        <h2 className="font-display text-xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <p className="mt-2 text-sm text-text-secondary">
          Fişştech mobil uygulamasını açıp reklam izleyerek bu özelliği ücretsiz
          kullanabilirsin — kazandığın hak burada, web sitesinde de geçerli olur.
        </p>
        <Button variant="primary" size="md" className="mt-6 w-full" onClick={retry} disabled={checking}>
          {checking ? "Kontrol ediliyor…" : "Reklamı İzledim, Tekrar Dene"}
        </Button>
        <Link href="/#pricing" className={buttonVariants("secondary", "md", "mt-3 w-full")}>
          Premium&apos;a Geç
        </Link>
      </Card>
    </div>
  );
}
