"use client";

import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { setActiveBusinessId } from "@/lib/esnaf/active-business";
import type { BusinessRow } from "@/lib/types/esnaf";
import { BUSINESS_SECTORS } from "@/lib/types/esnaf";

export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: BusinessRow[];
  activeId: string;
}) {
  const router = useRouter();

  if (businesses.length <= 1) {
    const biz = businesses[0];
    const sector = biz ? BUSINESS_SECTORS.find((s) => s.key === biz.sector) : undefined;
    return (
      <div className="flex items-center gap-2 text-text-primary">
        {sector ? (
          <sector.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
        ) : (
          <Store className="h-5 w-5 text-accent" strokeWidth={1.5} />
        )}
        <span className="font-display font-semibold">{biz ? biz.name : "İşletme"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-5 w-5 text-accent" />
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
