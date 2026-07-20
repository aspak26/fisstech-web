"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, CheckCircle2, Circle, Timer, Hourglass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/currency";
import { startTimeLog, stopTimeLog, toggleTaskCompleted } from "@/lib/data/freelance";
import type { FreelanceProjectRow, FreelanceTimeLogRow, ProjectTaskRow } from "@/lib/types/esnaf";

const POMODORO_PRESETS = [25, 50, 90];

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // ── Pomodoro (mobildeki gorevler_screen.dart ile aynı: Kronometre/Pomodoro
  // mod seçici, aktif kayıt varken kilitli, hedef dolunca otomatik durdurur) ──
  const [isPomodoroMode, setIsPomodoroMode] = useState(false);
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customTarget, setCustomTarget] = useState("");
  const pomodoroCompletedRef = useRef(false);

  useEffect(() => {
    if (!activeLog) return;
    const log = activeLog;
    pomodoroCompletedRef.current = false;
    const startedAtMs = new Date(log.started_at).getTime();

    function tick() {
      const seconds = Math.floor((Date.now() - startedAtMs) / 1000);
      setElapsedSeconds(seconds);
      if (isPomodoroMode && !pomodoroCompletedRef.current && seconds >= targetMinutes * 60) {
        pomodoroCompletedRef.current = true;
        stopTimeLog(createClient(), log).then(() => {
          setNotice(`Pomodoro tamamlandı! ${targetMinutes} dakika odaklandınız.`);
          router.refresh();
        });
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeLog, isPomodoroMode, targetMinutes, router]);

  const displayTime = activeLog
    ? isPomodoroMode
      ? formatDuration(targetMinutes * 60 - elapsedSeconds)
      : formatDuration(elapsedSeconds)
    : "00:00:00";

  async function handleStart() {
    if (!projectId) return;
    if (isPomodoroMode && isCustomTarget) {
      const n = Number(customTarget);
      if (n > 0) setTargetMinutes(n);
    }
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

        {notice && (
          <p className="mb-3 rounded-control border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
            {notice}
          </p>
        )}

        <div className="mb-3 flex overflow-hidden rounded-control border border-border">
          <button
            type="button"
            disabled={!!activeLog}
            onClick={() => setIsPomodoroMode(false)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-semibold disabled:cursor-not-allowed",
              !isPomodoroMode ? "bg-accent text-on-accent" : "bg-surface text-text-secondary",
            )}
          >
            <Timer className="h-3.5 w-3.5" /> Kronometre
          </button>
          <button
            type="button"
            disabled={!!activeLog}
            onClick={() => setIsPomodoroMode(true)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-semibold disabled:cursor-not-allowed",
              isPomodoroMode ? "bg-accent text-on-accent" : "bg-surface text-text-secondary",
            )}
          >
            <Hourglass className="h-3.5 w-3.5" /> Pomodoro
          </button>
        </div>

        {activeLog ? (
          <div className="flex items-center justify-between rounded-control border border-accent bg-accent/5 p-4">
            <div>
              <p className="font-display text-2xl font-bold text-accent">{displayTime}</p>
              <p className="text-sm text-text-secondary">{projectMap.get(activeLog.project_id)?.name ?? "Proje"}</p>
              {isPomodoroMode && <p className="text-xs text-text-secondary">Pomodoro · {targetMinutes} dk geri sayım</p>}
            </div>
            <Button variant="danger" size="sm" disabled={saving} onClick={handleStop} className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> Durdur
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState icon={Timer} title="Zaman takibi için önce bir proje oluştur" />
        ) : (
          <div className="space-y-3">
            {isPomodoroMode && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-text-secondary">Süre</p>
                <div className="flex flex-wrap gap-2">
                  {POMODORO_PRESETS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => {
                        setTargetMinutes(min);
                        setIsCustomTarget(false);
                      }}
                      className={cn(
                        "rounded-control border px-3 py-1.5 text-sm font-medium",
                        !isCustomTarget && targetMinutes === min
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:border-accent",
                      )}
                    >
                      {min} dk
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomTarget(true)}
                    className={cn(
                      "rounded-control border px-3 py-1.5 text-sm font-medium",
                      isCustomTarget ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-accent",
                    )}
                  >
                    Özel
                  </button>
                </div>
                {isCustomTarget && (
                  <Input
                    type="number"
                    placeholder="Dakika"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="mt-2 w-32"
                  />
                )}
              </div>
            )}
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
