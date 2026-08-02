"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gift, Star, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dismissTrialOfferAction, startTrialAction } from "@/lib/actions/trial";

/** fisle_app'teki TrialOfferDialog ile aynı: kredi kartı istemeyen, 7 günlük
 * ücretsiz premium deneme teklifi. `canStartTrial && !trialOfferDismissed`
 * durumunda uygulama shell'i (layout) tarafından bir kere gösterilir. */
export function TrialOfferDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleDismiss() {
    setOpen(false);
    await dismissTrialOfferAction();
  }

  async function handleStart() {
    setLoading(true);
    const result = await startTrialAction();
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleDismiss} title="" className="text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-warning/20">
        <Gift className="h-7 w-7 text-warning" />
      </div>
      <h2 className="mb-2 font-display text-lg font-semibold text-text-primary">
        7 Gün Ücretsiz Premium Dene!
      </h2>
      <p className="mb-6 text-sm text-text-secondary">
        Kredi kartı gerekmez, ücret alınmaz.
        <br />
        <br />
        Özet Rapor, Toplu Fiş Tarama, Bulut Yedekleme ve tüm premium özellikleri 7 gün boyunca sınırsız kullan.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="secondary" onClick={handleDismiss} disabled={loading}>
          Şimdi Değil
        </Button>
        <Button onClick={handleStart} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Denemeyi Başlat
        </Button>
      </div>
    </Dialog>
  );
}
