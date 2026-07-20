"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { FreelanceClientRow, FreelanceProjectRow, FreelanceProjectStatus } from "@/lib/types/esnaf";
import { FreelanceProjectDialog } from "./freelance-project-dialog";

const STATUS_LABEL: Record<FreelanceProjectStatus, string> = {
  planning: "Planlama",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

const STATUS_TONE: Record<FreelanceProjectStatus, "neutral" | "accent" | "success" | "danger"> = {
  planning: "neutral",
  in_progress: "accent",
  completed: "success",
  cancelled: "danger",
};

export function FreelanceProjelerList({
  businessId,
  projects,
  clients,
}: {
  businessId: string;
  projects: FreelanceProjectRow[];
  clients: FreelanceClientRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | FreelanceProjectStatus>("all");
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const visible = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "planning", "in_progress", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === s ? "border-accent bg-accent text-on-accent" : "border-border bg-surface text-text-secondary hover:border-accent",
              )}
            >
              {s === "all" ? "Tümü" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni Proje
        </Button>
      </div>

      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Henüz proje yok" description="Yeni Proje ile ilk projeni oluştur." />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((project) => {
              const client = clientMap.get(project.client_id);
              return (
                <li key={project.id}>
                  <Link href={`/esnaf/freelance/projeler/${project.id}`} className="block py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-text-primary">{project.name}</p>
                          <Badge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</Badge>
                        </div>
                        <p className="truncate text-sm text-text-secondary">
                          {client?.name ?? "Bilinmeyen müşteri"}
                          {project.deadline ? ` · Teslim: ${project.deadline}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary">
                          {formatCurrency(Number(project.paid_amount))} / {formatCurrency(Number(project.total_budget))}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Number(project.completion_percentage)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <FreelanceProjectDialog open={dialogOpen} onClose={() => setDialogOpen(false)} businessId={businessId} clients={clients} />
    </div>
  );
}
