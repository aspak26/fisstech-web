"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, CheckCircle2, Circle, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { startTimeLog, stopTimeLog, toggleTaskCompleted } from "@/lib/data/freelance";
import type { FreelanceProjectRow, FreelanceTimeLogRow, ProjectTaskRow } from "@/lib/types/esnaf";

function formatElapsed(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FreelanceGorevler({
  businessId,
  projects,
  tasks,
  activeLog,
  recentLogs,
}: {
  businessId: string;
  projects: FreelanceProjectRow[];
  tasks: ProjectTaskRow[];
  activeLog: FreelanceTimeLogRow | null;
  recentLogs: FreelanceTimeLogRow[];
}) {
  const router = useRouter();
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const [elapsed, setElapsed] = useState(activeLog ? formatElapsed(activeLog.started_at) : "00:00:00");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeLog) return;
    const interval = setInterval(() => setElapsed(formatElapsed(activeLog.started_at)), 1000);
    return () => clearInterval(interval);
  }, [activeLog]);

  async function handleStart() {
    if (!projectId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const project = projectMap.get(projectId);
      await startTimeLog(supabase, {
        businessId,
        userId: user.id,
        projectId,
        taskId: null,
        description: description || null,
        hourlyRate: project ? Number(project.hourly_rate) : 0,
      });
      setDescription("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleStop() {
    if (!activeLog) return;
    setSaving(true);
    try {
      await stopTimeLog(createClient(), activeLog);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTask(task: ProjectTaskRow) {
    await toggleTaskCompleted(createClient(), task);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Zaman Takibi</CardTitle>
        </CardHeader>
        {activeLog ? (
          <div className="flex items-center justify-between rounded-control border border-accent bg-accent/5 p-4">
            <div>
              <p className="font-display text-2xl font-bold text-accent">{elapsed}</p>
              <p className="text-sm text-text-secondary">{projectMap.get(activeLog.project_id)?.name ?? "Proje"}</p>
            </div>
            <Button variant="danger" size="sm" disabled={saving} onClick={handleStop} className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> Durdur
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={Timer} title="Zaman takibi için önce bir proje oluştur" />
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="flex-1">
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Input placeholder="Açıklama (isteğe bağlı)" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
            <Button size="sm" disabled={saving || !projectId} onClick={handleStart} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Başlat
            </Button>
          </div>
        )}

        {recentLogs.length > 0 && (
          <ul className="mt-4 divide-y divide-border">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="text-text-primary">{projectMap.get(log.project_id)?.name ?? "Proje"}</p>
                  <p className="text-text-secondary">
                    {log.duration_minutes} dk {log.description ? `· ${log.description}` : ""}
                  </p>
                </div>
                <span className="font-medium text-text-primary">{formatCurrency(Number(log.total_amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yapılacaklar</CardTitle>
        </CardHeader>
        {tasks.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Açık görev yok" />
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <button type="button" onClick={() => handleToggleTask(t)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <Circle className="h-4 w-4 shrink-0 text-text-secondary" />
                  <span className="truncate text-text-primary">{t.title}</span>
                </button>
                <span className="shrink-0 text-xs text-text-secondary">{projectMap.get(t.project_id)?.name ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
