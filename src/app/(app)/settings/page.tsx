import Link from "next/link";
import { Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/modules/settings/profile-card";
import { AppearanceCard } from "@/components/modules/settings/appearance-card";
import { AccountDangerZone } from "@/components/modules/settings/account-danger-zone";
import { TrialStatusCard } from "@/components/modules/settings/trial-status-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserPlanInfo } from "@/lib/utils/entitlements";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, planInfo] = await Promise.all([
    supabase.from("users").select("name, email, plan_type").eq("id", user!.id).maybeSingle(),
    getUserPlanInfo(supabase, user!.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Ayarlar</h1>

      <Link href="/esnaf">
        <Card className="flex items-center gap-3 transition-colors hover:border-accent">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Store className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="font-medium text-text-primary">Esnaf Modu</p>
            <p className="text-sm text-text-secondary">İşletme hesabınıza geçin</p>
          </div>
        </Card>
      </Link>

      <ProfileCard
        name={profile?.name ?? ""}
        email={profile?.email ?? user!.email ?? ""}
        planType={profile?.plan_type ?? "free"}
      />

      <TrialStatusCard
        canStartTrial={planInfo.canStartTrial}
        isInTrial={planInfo.isInTrial}
        trialDaysLeft={planInfo.trialDaysLeft}
      />

      <AppearanceCard />

      <Card>
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
        </CardHeader>
        <p className="text-sm text-text-secondary">
          Bildirim tercihleri şu an mobil uygulamada cihaz bazlı olarak saklanıyor. Web için
          bildirim ayarları ileride bu sayfaya eklenecek.
        </p>
      </Card>

      <AccountDangerZone userId={user!.id} />
    </div>
  );
}
