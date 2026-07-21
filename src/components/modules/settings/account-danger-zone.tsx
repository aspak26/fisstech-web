"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const RESET_TABLES = [
  "goal_transactions",
  "goals",
  "savings_pool",
  "installment_plans",
  "expenses",
  "incomes",
  "fixed_expenses",
  "subscriptions",
  "investments",
  "price_alerts",
  "user_notes",
  "user_debts",
  "category_limits",
  "categories",
  "income_categories",
  "fixed_expense_categories",
];

/** Ported from mobile's settings_screen.dart — sign out, reset personal
 * data (child-tables-first delete order, matching UserProfileService.
 * resetAllUserData exactly — esnaf/business data and groups are
 * deliberately untouched, same scope as mobile), and delete account (the
 * already-existing delete_current_user SECURITY DEFINER RPC). */
export function AccountDangerZone({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"reset" | "delete" | "signout" | null>(null);

  async function handleSignOut() {
    setBusy("signout");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleReset() {
    if (!window.confirm("Tüm finansal verileriniz, harcamalarınız, gelirleriniz ve hedefleriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?")) return;
    if (!window.confirm("Son onay: verilerinizi tamamen sıfırlamak istediğinizden emin misiniz?")) return;
    setBusy("reset");
    try {
      const supabase = createClient();
      for (const table of RESET_TABLES) {
        await supabase.from(table).delete().eq("user_id", userId);
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.")) return;
    setBusy("delete");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("delete_current_user");
      if (error) throw error;
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      window.alert("Hesap silinirken bir hata oluştu, lütfen tekrar dene.");
      setBusy(null);
    }
  }

  return (
    <Card className="border-danger/30">
      <CardHeader>
        <CardTitle>Hesap</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        <Button variant="secondary" className="w-full justify-start gap-2" disabled={!!busy} onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> {busy === "signout" ? "Çıkış yapılıyor…" : "Çıkış Yap"}
        </Button>
        <Button variant="secondary" className="w-full justify-start gap-2 text-danger hover:bg-danger/10" disabled={!!busy} onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> {busy === "reset" ? "Sıfırlanıyor…" : "Verileri Sıfırla"}
        </Button>
        <Button variant="danger" className="w-full justify-start gap-2" disabled={!!busy} onClick={handleDeleteAccount}>
          <Trash2 className="h-4 w-4" /> {busy === "delete" ? "Siliniyor…" : "Hesabı Sil"}
        </Button>
      </div>
    </Card>
  );
}
