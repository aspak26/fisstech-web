"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createInvite } from "@/lib/data/groups";

/** Ported from mobile's group_invite_sheet.dart — auto-creates a fresh
 * invite on open (expiring any previous pending one), shows the link to
 * copy. 7 days validity, matching the DB default. */
export function InviteDialog({ open, onClose, groupId, userId }: { open: boolean; onClose: () => void; groupId: string; userId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    createInvite(createClient(), groupId, userId)
      .then(setToken)
      .finally(() => setLoading(false));
  }, [open, groupId, userId]);

  const link = token && typeof window !== "undefined" ? `${window.location.origin}/join/${token}` : "";

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Davet Bağlantısı">
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-text-secondary">Oluşturuluyor…</p>
        ) : token ? (
          <>
            <p className="break-all rounded-control border border-border bg-bg p-3 text-sm text-text-primary">{link}</p>
            <p className="text-xs text-text-secondary">7 gün geçerlidir. Yeni bir bağlantı oluşturursan bu geçersiz olur.</p>
            <Button className="w-full gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Kopyalandı" : "Bağlantıyı Kopyala"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-danger">Davet oluşturulamadı, lütfen tekrar dene.</p>
        )}
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
