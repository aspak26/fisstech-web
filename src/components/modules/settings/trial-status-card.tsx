"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startTrialAction } from "@/lib/actions/trial";

export function TrialStatusCard({
  canStartTrial,
  isInTrial,
  trialDaysLeft,
}: {
  canStartTrial: boolean;
  isInTrial: boolean;
  trialDaysLeft: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!canStartTrial && !isInTrial) return null;

  async function handleStart() {
    setLoading(true);
    const result = await startTrialAction();
    setLoading(false);
    if (result.success) router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>7 Günlük Ücretsiz Deneme</CardTitle>
      </CardHeader>
      {isInTrial ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
            <Sparkles className="h-5 w-5 text-warning" />
          </div>
          <p className="text-sm text-text-secondary">
            Deneme süren aktif — <span className="font-medium text-text-primary">{trialDaysLeft} gün kaldı</span>.
            Tüm premium özellikler açık (mobil ve web'de aynı anda geçerli).
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/20">
              <Gift className="h-5 w-5 text-warning" />
            </div>
            <p className="text-sm text-text-secondary">
              Kredi kartı gerekmez. 7 gün boyunca tüm premium özellikleri sınırsız dene.
            </p>
          </div>
          <Button onClick={handleStart} disabled={loading} size="sm" className="shrink-0 gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Denemeyi Başlat
          </Button>
        </div>
      )}
    </Card>
  );
}
