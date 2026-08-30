"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { parseFamilyInviteToken } from "@/lib/data/family";

/** Ported from mobile's Settings → Aboneliğim → "Davet Kodun mu Var?". */
export function JoinFamilyCodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit() {
    const token = parseFamilyInviteToken(code);
    if (!token) return;
    onClose();
    setCode("");
    router.push(`/join-family/${token}`);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Davet Kodun mu Var?">
      <div className="space-y-4">
        <div>
          <Label htmlFor="family-invite-code">Davet Kodu veya Bağlantısı</Label>
          <Input
            id="family-invite-code"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Kodu veya bağlantıyı yapıştır"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            İptal
          </Button>
          <Button type="button" disabled={!code.trim()} onClick={handleSubmit}>
            Devam Et
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
