"use client";

import { useMemo } from "react";
import { Receipt } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import type { FreelanceClientRow, FreelanceProjectRow, ProjectMilestoneRow } from "@/lib/types/esnaf";

export function FreelanceFinans({
  projects,
  clients,
  milestones,
}: {
  projects: FreelanceProjectRow[];
  clients: FreelanceClientRow[];
  milestones: ProjectMilestoneRow[];
}) {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const collected = milestones.filter((m) => m.is_paid).reduce((s, m) => s + Number(m.amount), 0);
  const pending = milestones.filter((m) => !m.is_paid).reduce((s, m) => s + Number(m.amount), 0);

  const pendingByClient = useMemo(() => {
    const totals = new Map<string, number>();
    for (const m of milestones.filter((x) => !x.is_paid)) {
      const project = projectMap.get(m.project_id);
      if (!project) continue;
      totals.set(project.client_id, (totals.get(project.client_id) ?? 0) + Number(m.amount));
    }
    return [...totals.entries()]
      .map(([clientId, total]) => ({ client: clientMap.get(clientId), total }))
      .filter((e) => e.client)
      .sort((a, b) => b.total - a.total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestones]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-success/30 bg-success/5">
          <p className="text-sm text-text-secondary">Tahsil Edildi</p>
          <p className="font-display text-xl font-bold text-success">{formatCurrency(collected)}</p>
        </Card>
        <Card className="border-danger/30 bg-danger/5">
          <p className="text-sm text-text-secondary">Bekleyen</p>
          <p className="font-display text-xl font-bold text-danger">{formatCurrency(pending)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Bazlı Bekleyen Bakiye</CardTitle>
        </CardHeader>
        {pendingByClient.length === 0 ? (
          <EmptyState icon={Receipt} title="Bekleyen bakiye yok" />
        ) : (
          <ul className="divide-y divide-border">
            {pendingByClient.map(({ client, total }) => (
              <li key={client!.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-text-primary">{client!.name}</span>
                <span className="font-medium text-danger">{formatCurrency(total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proje Bazlı Gelir</CardTitle>
        </CardHeader>
        {projects.length === 0 ? (
          <EmptyState icon={Receipt} title="Henüz proje yok" />
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => {
              const ratio = Number(p.total_budget) > 0 ? Math.min(100, (Number(p.paid_amount) / Number(p.total_budget)) * 100) : 0;
              return (
                <li key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-primary">{p.name}</span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(Number(p.paid_amount))} / {formatCurrency(Number(p.total_budget))}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                    <div className="h-full rounded-full bg-success" style={{ width: `${ratio}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <button
        type="button"
        disabled
        title="Bu özellik mobil uygulamada da henüz aktif değil"
        className="w-full cursor-not-allowed rounded-control border border-dashed border-border py-3 text-sm font-medium text-text-secondary opacity-60"
      >
        Hızlı Fatura (PDF) — yakında
      </button>
    </div>
  );
}
