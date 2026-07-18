"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const PLAN_LABELS: Record<string, string> = {
  free: "Ücretsiz",
  premium: "Premium",
  family: "Aile",
  esnaf_premium: "Esnaf Premium",
};

export function UserMenu({
  name,
  email,
  planType,
}: {
  name: string;
  email: string;
  planType: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-control p-1 hover:bg-bg"
      >
        <Avatar name={name || email} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-card border border-border bg-surface p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate font-medium text-text-primary">{name || "Kullanıcı"}</p>
            <p className="truncate text-sm text-text-secondary">{email}</p>
            <Badge tone="accent" className="mt-2">
              {PLAN_LABELS[planType] ?? planType}
            </Badge>
          </div>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}
