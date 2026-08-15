import { EsnafLockedPage } from "@/components/ui/esnaf-locked-page";

// Esnaf Modu geçici olarak herkes için kapatıldı (is_admin dahil) — bkz.
// src/app/(app)/esnaf/page.tsx üstündeki aynı not. Bu dosyanın orijinal
// (isAdminUser + realtime tablo aboneliği + işletme aboneliği kontrolü)
// mantığı git geçmişinde duruyor, geri açmak için oradan geri getirilebilir.
export default async function EsnafDashboardLayout() {
  return <EsnafLockedPage />;
}
