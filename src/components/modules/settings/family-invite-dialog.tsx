"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createFamilyInvite, type FamilyInviteRow } from "@/lib/data/family";

/** Ported from mobile's family_invite_sheet.dart — auto-creates a fresh
 * invite on open (expiring any previous pending one), shows the link to
 * copy. 7 days validity, matching the DB default. */
export function FamilyInviteDialog({ open, onClose, ownerId }: { open: boolean; onClose: () => void; ownerId: string }) {
  const [invite, setInvite] = useState<FamilyInviteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    createFamilyInvite(createClient(), ownerId)
      .then(setInvite)
      .catch((err) => setError(err instanceof Error ? err.message : "Davet oluşturulamadı"))
      .finally(() => setLoading(false));
  }, [open, ownerId]);

  const link = invite && typeof window !== "undefined" ? `${window.location.origin}/join-family/${invite.token}` : "";

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Aile Paketine Davet Et">
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-text-secondary">Oluşturuluyor…</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : invite ? (
          <>
            <p className="break-all rounded-control border border-border bg-bg p-3 text-sm text-text-primary">{link}</p>
            <p className="text-xs text-text-secondary">7 gün geçerlidir. Yeni bir bağlantı oluşturursan bu geçersiz olur.</p>
            <Button className="w-full gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}
            </Button>
          </>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
