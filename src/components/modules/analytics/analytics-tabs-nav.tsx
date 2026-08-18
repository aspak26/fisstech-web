"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

const OPTIONS = [
  { value: "expenses", label: "Harcamalar" },
  { value: "income", label: "Gelir/Gider" },
  { value: "installments", label: "Taksitler" },
  { value: "subscriptions", label: "Abonelikler" },
  { value: "group", label: "Grup" },
];

export function AnalyticsTabsNav({ tab }: { tab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return <Tabs value={tab} onChange={go} options={OPTIONS} className="flex-wrap" />;
}
