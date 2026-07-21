import Image from "next/image";

// Gerçek logo görselleri — kaynak: design-assets/fişştech logo web/ (2500x2500,
// bol şeffaf boşluklu). Playwright canvas ile alpha bounding box'a otomatik
// kırpılıp public/'a kondu (bkz. PROGRESS.md): logo-f-icon.png 1415x1646,
// logo-wordmark.png 1205x326 — next/image bu gerçek en-boy oranlarını kullanıyor.
const ICON_RATIO = 1415 / 1646;
const WORDMARK_RATIO = 1205 / 326;

/** İkisi de düz beyaz/şeffaf sanat eseri — açık modda (beyaz navbar üstünde)
 * görünmez olmasın diye `invert` ile koyulaştırılıyor, koyu modda (koyu
 * navbar) zaten olduğu gibi çalışıyor, `dark:invert-0` ile geri açılıyor. */
export function LogoHorizontal({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <div className={`flex flex-row items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logo-f-icon.png"
        alt="Fişştech"
        width={Math.round(height * ICON_RATIO)}
        height={height}
        className="invert dark:invert-0"
        priority
      />
      <Image
        src="/logo-wordmark.png"
        alt="Fişştech"
        width={Math.round(height * WORDMARK_RATIO)}
        height={height}
        className="invert dark:invert-0"
        priority
      />
    </div>
  );
}
