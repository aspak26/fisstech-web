"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { createStaffInvite } from "@/lib/data/esnaf-team";
import type { BusinessStaffRole } from "@/lib/types/esnaf";

export function TeamInviteDialog({
  open,
  onClose,
  businessId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
}) {
  const [role, setRole] = useState<BusinessStaffRole>("personel");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı");
      const newToken = await createStaffInvite(supabase, businessId, role, user.id);
      setToken(newToken);
    } catch {
      setError("Davet oluşturulamadı, lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setToken(null);
    setCopied(false);
    setError(null);
    setRole("personel");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Davet Kodu Oluştur">
      {token ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Bu kodu personelinizle paylaşın. Personel, hesabıyla giriş yaptıktan sonra &quot;Davetiye ile
            Katıl&quot; ekranından bu kodu girerek ekibinize katılabilir.
          </p>
          <div className="flex items-center gap-2 rounded-control border border-border bg-bg p-3">
            <code className="flex-1 truncate font-mono text-sm text-text-primary">{token}</code>
            <button
              type="button"
              aria-label="Kodu kopyala"
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopied(true);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-surface"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleClose} className="w-full">
            Kapat
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as BusinessStaffRole)}>
              <option value="personel">Personel</option>
              <option value="yardimci_yonetici">Yardımcı Yönetici</option>
            </Select>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={saving}>
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Oluşturuluyor…" : "Oluştur"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
