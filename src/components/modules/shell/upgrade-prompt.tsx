import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export function UpgradePrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center px-4 py-10">
      <Card className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Lock className="h-7 w-7 text-accent" />
        </div>
        <h2 className="font-display text-xl font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <Link href="/#pricing" className={buttonVariants("primary", "md", "mt-6 w-full")}>
          Planları İncele
        </Link>
        <p className="mt-3 text-xs text-text-secondary">
          Abonelikler şu an sadece mobil uygulama üzerinden satın alınabilir.
        </p>
      </Card>
    </div>
  );
}
