/** Yatay logo — kare tarama çerçeveli "F" simgesi + "Fişştech" kelime
 * markası. Mobil kaynak sanatı (fisstechlogo/*.png, "Green Visor") beyaz
 * tek renkli bir şekil, transparan zemin üzerine — pixel-perfect trace
 * yerine aynı konsept (tarama çerçevesi köşeleri + F) sade bir SVG olarak
 * yeniden kuruldu; currentColor kullanır, tema/renk otomatik uyum sağlar. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M2 7V4a2 2 0 0 1 2-2h3M22 7V4a2 2 0 0 0-2-2h-3M2 17v3a2 2 0 0 0 2 2h3M22 17v3a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 6h8v3.2H11V12h5v3h-5v5H8V6Z" fill="currentColor" />
    </svg>
  );
}

export function LogoHorizontal({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className="h-8 w-8 text-accent" />
      <span className="font-display text-xl font-bold tracking-tight text-text-primary">Fişştech</span>
    </div>
  );
}
