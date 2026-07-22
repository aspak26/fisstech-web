"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { BusinessSetupForm } from "./business-setup-form";
import { JoinBusinessForm } from "./join-business-form";

export function EsnafEntryTabs() {
  const [tab, setTab] = useState<"setup" | "join">("setup");

  return (
    <div>
      <div className="mx-auto mb-4 flex max-w-xl gap-1 rounded-control border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setTab("setup")}
          className={cn(
            "flex-1 rounded-control py-2 text-sm font-medium transition-colors",
            tab === "setup" ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text-primary",
          )}
        >
          İşletmeni Kur
        </button>
        <button
          type="button"
          onClick={() => setTab("join")}
          className={cn(
            "flex-1 rounded-control py-2 text-sm font-medium transition-colors",
            tab === "join" ? "bg-accent text-on-accent" : "text-text-secondary hover:text-text-primary",
          )}
        >
          Davetiye ile Katıl
        </button>
      </div>
      {tab === "setup" ? <BusinessSetupForm /> : <JoinBusinessForm />}
    </div>
  );
}
