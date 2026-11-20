import type { Metadata } from "next";
import { StoreRedirect } from "@/components/modules/landing/store-redirect";

export const metadata: Metadata = {
  title: "Fişştech'i İndir",
  description: "Fişştech'i Google Play veya App Store'dan ücretsiz indir.",
};

/** Instagram/TikTok biyografisindeki TEK link. Instagram'ın uygulama içi
 * tarayıcısı Android'de play.google.com linkini açamıyordu (kullanıcı
 * bildirimi 2026-11-20) — bu sayfa cihazı algılayıp mağaza uygulamasını
 * doğrudan açar, olmazsa iki büyük buton gösterir. */
export default function IndirPage() {
  return <StoreRedirect />;
}
