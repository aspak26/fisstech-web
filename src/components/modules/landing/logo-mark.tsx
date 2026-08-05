import Image from "next/image";

// Yeni şeffaf logo 1:1 kare formatında, wordmark ise eski orijinal oranında
const ICON_RATIO = 1;
const WORDMARK_RATIO = 1205 / 326;

export function LogoHorizontal({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <div className={`flex flex-row items-center gap-2 ${className ?? ""}`}>
      <LogoIcon height={height} />
      <LogoWordmark height={height} />
    </div>
  );
}

export function LogoIcon({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <Image
      src="/logo-f-icon.png"
      alt="Fişştech"
      width={Math.round(height * ICON_RATIO)}
      height={height}
      className={`rounded-lg ${className ?? ""}`}
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
