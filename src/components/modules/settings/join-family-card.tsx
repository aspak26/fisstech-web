"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2Off, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptFamilyInvite, type FamilyInvitePreview } from "@/lib/data/family";

/** Ported from mobile's join_family_screen.dart. */
export function JoinFamilyCard({ token, preview }: { token: string; preview: FamilyInvitePreview | null }) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const supabase = createClient();
      await acceptFamilyInvite(supabase, token);
      router.push("/settings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Katılım başarısız, lütfen tekrar dene.");
      setJoining(false);
    }
  }

  if (!preview) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <Link2Off className="h-12 w-12 text-danger" strokeWidth={1.5} />
        <h1 className="font-display text-xl font-semibold text-text-primary">Geçersiz Davet</h1>
        <p className="text-sm text-text-secondary">Bu davet bağlantısı geçersiz veya süresi dolmuş.</p>
        <Button onClick={() => router.push("/dashboard")}>Ana Sayfaya Dön</Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <Users className="h-12 w-12 text-accent" strokeWidth={1.5} />
      <p className="text-sm text-text-secondary">Aile Paketine Davet Edildiniz</p>
      <h1 className="font-display text-xl font-semibold text-text-primary">
        &ldquo;{preview.ownerName}&rdquo; Aile Paketine katılmak istiyor musunuz?
      </h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="mt-2 w-full space-y-2">
        <Button className="w-full" disabled={joining} onClick={handleJoin}>
          {joining ? "Katılınıyor…" : "Katıl"}
        </Button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full py-2 text-sm text-text-secondary hover:text-text-primary"
        >
          Reddet
        </button>
      </div>
    </Card>
  );
}
