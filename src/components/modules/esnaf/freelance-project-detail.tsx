"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import {
  addMilestone,
  addTask,
  deleteProjectExpense,
  deleteTask,
  toggleMilestonePaid,
  toggleTaskCompleted,
  updateProjectStatus,
} from "@/lib/data/freelance";
import type {
  FreelanceClientRow,
  FreelanceProjectRow,
  FreelanceProjectStatus,
  ProjectExpenseRow,
  ProjectMilestoneRow,
  ProjectTaskRow,
} from "@/lib/types/esnaf";
import { ProjectExpenseDialog } from "./project-expense-dialog";

const STATUS_LABEL: Record<FreelanceProjectStatus, string> = {
  planning: "Planlama",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export function FreelanceProjectDetail({
  businessId,
  project,
  client,
  milestones,
  tasks,
  expenses,
}: {
  businessId: string;
  project: FreelanceProjectRow;
  client: FreelanceClientRow | null;
  milestones: ProjectMilestoneRow[];
  tasks: ProjectTaskRow[];
  expenses: ProjectExpenseRow[];
}) {
  const router = useRouter();
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneAmount, setNewMilestoneAmount] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  async function handleStatusChange(status: FreelanceProjectStatus) {
    await updateProjectStatus(createClient(), project.id, status);
    router.refresh();
  }

  async function handleAddMilestone() {
    const amount = Number(newMilestoneAmount);
    if (!newMilestoneName.trim() || !amount) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await addMilestone(supabase, {
      businessId,
      userId: user.id,
      projectId: project.id,
      name: newMilestoneName.trim(),
      amount,
      dueDate: null,
    });
    setNewMilestoneName("");
    setNewMilestoneAmount("");
    router.refresh();
  }

  async function handleToggleMilestone(milestone: ProjectMilestoneRow) {
    await toggleMilestonePaid(createClient(), milestone);
    router.refresh();
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await addTask(supabase, { businessId, userId: user.id, projectId: project.id, title: newTaskTitle.trim() });
    setNewTaskTitle("");
    router.refresh();
  }

  async function handleToggleTask(task: ProjectTaskRow) {
    await toggleTaskCompleted(createClient(), task);
    router.refresh();
  }

  async function handleDeleteTask(task: ProjectTaskRow) {
    await deleteTask(createClient(), task);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold text-text-primary">{project.name}</h1>
            <p className="text-sm text-text-secondary">
              {client?.name ?? "Bilinmeyen müşteri"}
              {project.deadline ? ` · Teslim: ${project.deadline}` : ""}
            </p>
          </div>
          <Select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value as FreelanceProjectStatus)}
            className="w-40"
          >
            {(Object.keys(STATUS_LABEL) as FreelanceProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        {project.description && <p className="mt-2 text-sm text-text-secondary">{project.description}</p>}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
          <div className="h-full rounded-full bg-accent" style={{ width: `${Number(project.completion_percentage)}%` }} />
        </div>
        <p className="mt-1 text-xs text-text-secondary">%{Number(project.completion_percentage).toFixed(0)} tamamlandı</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span>
            Bütçe: <span className="font-medium text-text-primary">{formatCurrency(Number(project.total_budget))}</span>
          </span>
          <span>
            Tahsil edilen: <span className="font-medium text-success">{formatCurrency(Number(project.paid_amount))}</span>
          </span>
          <span>
            Masraflar: <span className="font-medium text-danger">{formatCurrency(totalExpenses)}</span>
          </span>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hakediş Aşamaları</CardTitle>
        </CardHeader>
        {milestones.length === 0 ? (
          <p className="text-sm text-text-secondary">Henüz aşama yok</p>
        ) : (
          <ul className="mb-3 divide-y divide-border">
            {milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <button type="button" onClick={() => handleToggleMilestone(m)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {m.is_paid ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-text-secondary" />}
                  <span className={cn("truncate", m.is_paid ? "text-text-secondary line-through" : "text-text-primary")}>{m.name}</span>
                </button>
                <span className={cn("font-medium", m.is_paid ? "text-text-secondary line-through" : "text-text-primary")}>
                  {formatCurrency(Number(m.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <Input placeholder="Aşama adı" value={newMilestoneName} onChange={(e) => setNewMilestoneName(e.target.value)} className="flex-1" />
          <Input placeholder="₺" type="number" step="0.01" value={newMilestoneAmount} onChange={(e) => setNewMilestoneAmount(e.target.value)} className="w-24" />
          <Button type="button" size="sm" onClick={handleAddMilestone}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Görevler</CardTitle>
        </CardHeader>
        {tasks.length === 0 ? (
          <p className="text-sm text-text-secondary">Henüz görev yok</p>
        ) : (
          <ul className="mb-3 divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <button type="button" onClick={() => handleToggleTask(t)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {t.is_completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-text-secondary" />}
                  <span className={cn("truncate", t.is_completed ? "text-text-secondary line-through" : "text-text-primary")}>{t.title}</span>
                </button>
                <button type="button" onClick={() => handleDeleteTask(t)} className="text-text-secondary hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Yeni görev"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            className="flex-1"
          />
          <Button type="button" size="sm" onClick={handleAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Masraflar</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => setExpenseDialogOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Masraf Ekle
          </Button>
        </CardHeader>
        {expenses.length === 0 ? (
          <p className="text-sm text-text-secondary">Henüz masraf yok</p>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{e.category}</Badge>
                    {e.description && <p className="truncate text-sm text-text-primary">{e.description}</p>}
                  </div>
                  <p className="text-sm text-text-secondary">{e.expense_date}</p>
                </div>
                <span className="font-medium text-danger">{formatCurrency(Number(e.amount))}</span>
                <DeleteButton confirmMessage="Bu masraf silinsin mi?" onDelete={() => deleteProjectExpense(createClient(), e.id)} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ProjectExpenseDialog
        open={expenseDialogOpen}
        onClose={() => setExpenseDialogOpen(false)}
        businessId={businessId}
        projectId={project.id}
      />
    </div>
  );
}
