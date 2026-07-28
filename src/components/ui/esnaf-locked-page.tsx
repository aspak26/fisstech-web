import { Lock } from "lucide-react";

/** Esnaf Modu tam olarak istenen seviyeye gelene kadar sadece admin/test
 * hesaplarına açık — bkz. src/lib/utils/admin.ts + esnaf/page.tsx ve
 * esnaf/(dashboard)/layout.tsx. */
export function EsnafLockedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <Lock className="h-7 w-7 text-accent" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-2xl font-semibold text-text-primary">Esnaf Modu</h1>
      <p className="max-w-sm text-text-secondary">
        Esnaf Modu şu anda test aşamasındadır, en kısa zamanda hizmetinize sunulacaktır.
      </p>
    </div>
  );
}
