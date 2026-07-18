"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "light", label: "Açık", icon: Sun },
  { value: "dark", label: "Koyu", icon: Moon },
  { value: "system", label: "Sistem", icon: MonitorSmartphone },
];

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Görünüm</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-control border border-border bg-bg p-4 text-sm font-medium text-text-secondary transition-colors hover:border-accent",
              mounted && theme === opt.value && "border-accent bg-accent/5 text-accent",
            )}
          >
            <opt.icon className="h-5 w-5" />
            {opt.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
