"use client";

import { useState } from "react";
import Image from "next/image";
import type { BankInfo } from "@/lib/data/banks";

/** Banka logosu — public/banks/{domain}.png; bulunamazsa (veya bilinmeyen
 * bir banka ise) rengin/baş harfin olduğu bir daireye düşer. Mobildeki
 * BankLogoWidget'ın (_buildInitials) web karşılığı. */
export function BankLogo({ bank, size = 40 }: { bank: BankInfo; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg font-bold text-white"
        style={{
          width: size,
          height: size,
          backgroundColor: bank.colorHex ? `#${bank.colorHex}` : "#424242",
          fontSize: size * 0.5,
        }}
      >
        {bank.name ? bank.name[0].toUpperCase() : "B"}
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg bg-white"
      style={{ width: size, height: size }}
    >
      <Image
        src={`/banks/${bank.domain}.png`}
        alt={bank.name}
        fill
        sizes={`${size}px`}
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
