import { Construction } from "lucide-react";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
        <Construction className="h-7 w-7 text-accent" strokeWidth={1.5} />
      </div>
      <h1 className="font-display text-2xl font-semibold text-text-primary">{title}</h1>
      <p className="max-w-sm text-text-secondary">
        Bu modül şu anda geliştiriliyor. Fişştech Web&apos;in bir sonraki fazında
        buraya gelecek — mobil uygulamada kullanmaya devam edebilirsiniz.
      </p>
    </div>
  );
}
