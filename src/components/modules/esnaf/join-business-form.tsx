"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Link2Off } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { acceptStaffInvite, getStaffInvitePreview, type StaffInvitePreview } from "@/lib/data/esnaf-team";
import { setActiveBusinessId } from "@/lib/esnaf/active-business";

/** Ekip'e (davet kodlu personel) katılma formu — davet OLUŞTURMA sahip-only
 * /esnaf/ekip'te (bkz. team-invite-dialog.tsx), bu form davet KABUL ETME
 * tarafı. Henüz hiç işletmesi olmayan bir kullanıcı için giriş noktası,
 * bkz. esnaf-entry-tabs.tsx. */
export function JoinBusinessForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<StaffInvitePreview | null | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!token.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const supabase = createClient();
      const result = await getStaffInvitePreview(supabase, token.trim());
      const isActive = !!result && result.status === "pending" && new Date(result.expiresAt) > new Date();
      setPreview(isActive ? result : null);
    } finally {
      setChecking(false);
    }
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const supabase = createClient();
      const result = await acceptStaffInvite(supabase, token.trim());
      await setActiveBusinessId(result.businessId);
      router.push("/esnaf/pano");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Katılım başarısız, lütfen tekrar deneyin.");
      setJoining(false);
    }
  }

  if (preview === null) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
        <Link2Off className="h-10 w-10 text-danger" strokeWidth={1.5} />
        <p className="text-sm text-text-secondary">Bu davet kodu geçersiz veya süresi dolmuş.</p>
        <Button variant="secondary" onClick={() => setPreview(undefined)}>
          Tekrar Dene
        </Button>
      </Card>
    );
  }

  if (preview) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
        <UserPlus className="h-10 w-10 text-accent" strokeWidth={1.5} />
        <p className="text-sm text-text-secondary">Davet Edildiniz</p>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          &ldquo;{preview.businessName}&rdquo; — Katılmak istiyor musunuz?
        </h2>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="mt-2 w-full space-y-2">
          <Button className="w-full" disabled={joining} onClick={handleJoin}>
            {joining ? "Katılınıyor…" : "Katıl"}
          </Button>
          <button
            type="button"
            onClick={() => setPreview(undefined)}
            className="w-full py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            Vazgeç
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-xl font-semibold text-text-primary">Davetiye ile Katıl</h1>
      <p className="mb-6 text-sm text-text-secondary">
        İşletme sahibinizden aldığınız davet kodunu girin.
      </p>
      <div className="space-y-4">
        <div>
          <Label htmlFor="inviteToken">Davet Kodu</Label>
          <Input
            id="inviteToken"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Örn. a1b2c3d4..."
          />
        </div>
        <Button className="w-full" disabled={checking || !token.trim()} onClick={handleCheck}>
          {checking ? "Kontrol ediliyor…" : "Kodu Doğrula"}
        </Button>
      </div>
    </Card>
  );
}
