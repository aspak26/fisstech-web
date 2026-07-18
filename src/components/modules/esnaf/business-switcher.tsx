"use client";

import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { setActiveBusinessId } from "@/lib/esnaf/active-business";
import type { BusinessRow } from "@/lib/types/esnaf";
import { sectorEmoji } from "@/lib/types/esnaf";

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
    return (
      <div className="flex items-center gap-2 text-text-primary">
        <Store className="h-5 w-5 text-accent" />
        <span className="font-display font-semibold">
          {biz ? `${sectorEmoji(biz.sector)} ${biz.name}` : "İşletme"}
        </span>
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
            {sectorEmoji(b.sector)} {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
