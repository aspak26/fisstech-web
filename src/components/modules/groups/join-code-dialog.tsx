"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { parseInviteToken } from "@/lib/data/groups";

export function JoinCodeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit() {
    const token = parseInviteToken(code);
    if (!token) return;
    onClose();
    setCode("");
    router.push(`/join/${token}`);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Davet Kodu Gir">
      <div className="space-y-4">
        <div>
          <Label htmlFor="invite-code">Davet Kodu veya Bağlantısı</Label>
          <Input
            id="invite-code"
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
