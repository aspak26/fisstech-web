import { EsnafLockedPage } from "@/components/ui/esnaf-locked-page";

// Esnaf Modu geçici olarak herkes için kapatıldı (is_admin dahil). Kod
// silinmedi — sadece bu sayfa artık koşulsuz kilit ekranı gösteriyor.
// Geri açmak için: isAdminUser tabanlı orijinal mantığı geri getir (bkz.
// git geçmişi) — getActiveBusiness/redirect/EsnafEntryTabs importları ve
// kullanım şekli aynı kaldı.
export default async function EsnafEntryPage() {
  return <EsnafLockedPage />;
}
