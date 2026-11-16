import Image from "next/image";

// Yeni şeffaf logo 1:1 kare formatında, wordmark ise eski orijinal oranında
const ICON_RATIO = 1;
const WORDMARK_RATIO = 1205 / 326;

// logo-f-icon.png'nin görünür çizimi (F harfi + tarama köşeleri) kendi kare
// canvas'ının yaklaşık %77'sini kaplıyor, logo-wordmark.png'deki metin ise
// neredeyse kenardan kenara (~%97). Aynı `height` ile yan yana konunca ikon
// wordmark'a göre gözle görülür küçük duruyor — ikonu bu oranla büyüterek
// görünür glif yüksekliklerini eşitliyoruz. Sadece LogoHorizontal'daki
// eşleşmeyi düzeltir; LogoIcon/LogoWordmark tek başına kullanıldığında
// (sidebar, hero vb.) etkilenmez.
const ICON_VISUAL_SCALE = 1.15;

export function LogoHorizontal({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <div className={`flex flex-row items-center gap-2 ${className ?? ""}`}>
      <LogoIcon height={height * ICON_VISUAL_SCALE} />
      <LogoWordmark height={height} />
    </div>
  );
}

/** 2026-11-14 kâğıt dokulu logo (mobil assets/logo.png ile aynı): krem kâğıt
 * zemin kendi içinde olduğu için tema tersine çevrilmez; mürekkep kenarlı,
 * hafif düzensiz köşeli küçük bir karton kutucuk olarak gösterilir. */
export function LogoIcon({ className, height = 32 }: { className?: string; height?: number }) {
  const size = Math.round(height * ICON_RATIO);
  return (
    <Image
      src="/logo-kagit.png"
      alt="Fişştech"
      width={size}
      height={size}
      className={`shrink-0 rounded-lg border-[1.5px] border-ink/70 shadow-xs ${className ?? ""}`}
      priority
    />
  );
}

export function LogoWordmark({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/logo-wordmark.png"
      alt="Fişştech"
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      className={`invert dark:invert-0 ${className ?? ""}`}
      priority
    />
  );
}
