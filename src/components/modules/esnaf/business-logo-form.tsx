"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadBusinessLogo } from "@/lib/esnaf/business-logo";
import { Card } from "@/components/ui/card";
import type { BusinessRow } from "@/lib/types/esnaf";

export function BusinessLogoForm({ business }: { business: BusinessRow }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(business.logo_url);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const url = await uploadBusinessLogo(supabase, user.id, business.id, file);
      setPreview(url);
      router.refresh();
    } catch {
      setError("Logo yüklenemedi, lütfen tekrar dene.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <h2 className="mb-1 font-display text-base font-semibold text-text-primary">İşletme Görünümü</h2>
      <p className="mb-4 text-sm text-text-secondary">Şirket logosu / banner — ekranların üst kısmında görünür.</p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center gap-4 rounded-control border border-border p-3 text-left transition-colors hover:border-accent hover:bg-accent/5 disabled:opacity-60"
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10">
          {preview ? (
            <Image src={preview} alt="" fill sizes="56px" className="object-cover" unoptimized />
          ) : (
            <Store className="h-6 w-6 text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text-primary">Logo Değiştir</p>
          <p className="text-sm text-text-secondary">{uploading ? "Yükleniyor…" : "Görsel seçmek için tıkla"}</p>
        </div>
        <Camera className="h-5 w-5 shrink-0 text-text-secondary" />
      </button>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Logo dosyası seç"
      />
    </Card>
  );
}
