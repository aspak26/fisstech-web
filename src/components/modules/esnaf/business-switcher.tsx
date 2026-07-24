"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Store } from "lucide-react";
import { setActiveBusinessId } from "@/lib/esnaf/active-business";
import type { BusinessRow } from "@/lib/types/esnaf";
import { BUSINESS_SECTORS } from "@/lib/types/esnaf";

/** İşletmenin yüklediği logo varsa onu, yoksa sektör ikonunu gösterir —
 * her işletme kendi panelinde kendi logosuyla görünür. */
function BusinessAvatar({ business }: { business: BusinessRow | undefined }) {
  const sector = business ? BUSINESS_SECTORS.find((s) => s.key === business.sector) : undefined;
  const SectorIcon = sector?.icon ?? Store;

  if (business?.logo_url) {
    return (
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
        <Image src={business.logo_url} alt="" fill sizes="32px" className="object-cover" unoptimized />
      </div>
    );
  }

  return <SectorIcon className="h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />;
}

export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: BusinessRow[];
  activeId: string;
}) {
  const router = useRouter();
  const activeBusiness = businesses.find((b) => b.id === activeId);

  if (businesses.length <= 1) {
    const biz = businesses[0];
    return (
      <div className="flex items-center gap-2.5 text-text-primary">
        <BusinessAvatar business={biz} />
        <span className="font-display font-semibold">{biz ? biz.name : "İşletme"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <BusinessAvatar business={activeBusiness} />
      <select
        value={activeId}
        onChange={async (e) => {
          await setActiveBusinessId(e.target.value);
          router.refresh();
        }}
        className="rounded-control border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-text-primary"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
