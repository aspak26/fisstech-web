import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FreelanceClientRow,
  FreelanceProjectRow,
  FreelanceProjectStatus,
  FreelanceTimeLogRow,
  ProjectExpenseRow,
  ProjectMilestoneRow,
  ProjectTaskRow,
} from "@/lib/types/esnaf";
import { requireUserId } from "@/lib/utils/auth";

// ─── Müşteriler ─────────────────────────────────────────────────────────────

export async function getFreelanceClients(
  supabase: SupabaseClient,
  businessId: string,
): Promise<FreelanceClientRow[]> {
  try {
    const { data } = await supabase
      .from("freelance_clients")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as FreelanceClientRow[];
  } catch {
    return [];
  }
}

export async function createFreelanceClient(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    name: string;
    companyName: string | null;
    phone: string | null;
    email: string | null;
    taxId: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("freelance_clients")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      name: payload.name,
      company_name: payload.companyName,
      phone: payload.phone,
      email: payload.email,
      tax_id: payload.taxId,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Müşteri eklenemedi");
  return data.id as string;
}

export async function updateFreelanceClient(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<FreelanceClientRow, "name" | "company_name" | "phone" | "email" | "address" | "tax_id" | "notes">>,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("freelance_clients")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function deleteFreelanceClient(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("freelance_clients").delete().eq("id", id).eq("user_id", userId);
}

// ─── Projeler ───────────────────────────────────────────────────────────────

export async function getFreelanceProjects(
  supabase: SupabaseClient,
  businessId: string,
): Promise<FreelanceProjectRow[]> {
  try {
    const { data } = await supabase
      .from("freelance_projects")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    return (data ?? []) as FreelanceProjectRow[];
  } catch {
    return [];
  }
}

export async function getFreelanceProject(
  supabase: SupabaseClient,
  id: string,
): Promise<FreelanceProjectRow | null> {
  const { data } = await supabase.from("freelance_projects").select("*").eq("id", id).maybeSingle();
  return (data as FreelanceProjectRow) ?? null;
}

export interface NewMilestone {
  name: string;
  amount: number;
  dueDate: string | null;
}

export async function createFreelanceProject(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    clientId: string;
    name: string;
    description: string | null;
    totalBudget: number;
    hourlyRate: number;
    deadline: string | null;
    milestones: NewMilestone[];
  },
): Promise<string> {
  const { data: created, error } = await supabase
    .from("freelance_projects")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      client_id: payload.clientId,
      name: payload.name,
      description: payload.description,
      total_budget: payload.totalBudget,
      hourly_rate: payload.hourlyRate,
      deadline: payload.deadline,
    })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("Proje oluşturulamadı");

  const projectId = created.id as string;
  if (payload.milestones.length > 0) {
    await supabase.from("project_milestones").insert(
      payload.milestones.map((m) => ({
        project_id: projectId,
        business_id: payload.businessId,
        user_id: payload.userId,
        name: m.name,
        amount: m.amount,
        due_date: m.dueDate,
      })),
    );
  }
  return projectId;
}

export async function updateProjectStatus(
  supabase: SupabaseClient,
  id: string,
  status: FreelanceProjectStatus,
): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase
    .from("freelance_projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}

// ─── Hakediş Aşamaları ──────────────────────────────────────────────────────

export async function getProjectMilestones(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectMilestoneRow[]> {
  try {
    const { data } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("due_date", { ascending: true, nullsFirst: false });
    return (data ?? []) as ProjectMilestoneRow[];
  } catch {
    return [];
  }
}

/** Hakedişi ödendi/ödenmedi işaretler ve projenin paid_amount'unu yeniden
 * hesaplar — mobildeki markPaid/markUnpaid ile aynı. */
export async function toggleMilestonePaid(
  supabase: SupabaseClient,
  milestone: ProjectMilestoneRow,
): Promise<void> {
  const userId = await requireUserId(supabase);
  const nextPaid = !milestone.is_paid;
  await supabase
    .from("project_milestones")
    .update({ is_paid: nextPaid, paid_at: nextPaid ? new Date().toISOString() : null })
    .eq("id", milestone.id)
    .eq("user_id", userId);

  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("amount, is_paid")
    .eq("project_id", milestone.project_id);
  const paidTotal = ((milestones ?? []) as { amount: number; is_paid: boolean }[])
    .filter((m) => m.is_paid)
    .reduce((s, m) => s + Number(m.amount), 0);
  await supabase
    .from("freelance_projects")
    .update({ paid_amount: paidTotal })
    .eq("id", milestone.project_id)
    .eq("user_id", userId);
}

export async function getAllMilestonesForBusiness(
  supabase: SupabaseClient,
  businessId: string,
): Promise<ProjectMilestoneRow[]> {
  try {
    const { data } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("business_id", businessId)
      .order("due_date", { ascending: true, nullsFirst: false });
    return (data ?? []) as ProjectMilestoneRow[];
  } catch {
    return [];
  }
}

export async function addMilestone(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; projectId: string; name: string; amount: number; dueDate: string | null },
): Promise<void> {
  await supabase.from("project_milestones").insert({
    project_id: payload.projectId,
    business_id: payload.businessId,
    user_id: payload.userId,
    name: payload.name,
    amount: payload.amount,
    due_date: payload.dueDate,
  });
}

// ─── Görevler ───────────────────────────────────────────────────────────────

export async function getProjectTasks(supabase: SupabaseClient, projectId: string): Promise<ProjectTaskRow[]> {
  try {
    const { data } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order");
    return (data ?? []) as ProjectTaskRow[];
  } catch {
    return [];
  }
}

export async function getOpenTasksForBusiness(
  supabase: SupabaseClient,
  businessId: string,
): Promise<ProjectTaskRow[]> {
  try {
    const { data } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_completed", false)
      .order("created_at", { ascending: false });
    return (data ?? []) as ProjectTaskRow[];
  } catch {
    return [];
  }
}

export async function addTask(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; projectId: string; title: string },
): Promise<void> {
  await supabase.from("project_tasks").insert({
    project_id: payload.projectId,
    business_id: payload.businessId,
    user_id: payload.userId,
    title: payload.title,
  });
}

/** Görevi tamamlandı/tamamlanmadı işaretler ve projenin
 * completion_percentage'ını (tamamlanan / toplam × 100) yeniden hesaplar —
 * mobildeki recalcCompletion ile aynı. */
export async function toggleTaskCompleted(supabase: SupabaseClient, task: ProjectTaskRow): Promise<void> {
  const userId = await requireUserId(supabase);
  const nextCompleted = !task.is_completed;
  await supabase
    .from("project_tasks")
    .update({ is_completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null })
    .eq("id", task.id)
    .eq("user_id", userId);

  const { data: tasks } = await supabase.from("project_tasks").select("is_completed").eq("project_id", task.project_id);
  const all = (tasks ?? []) as { is_completed: boolean }[];
  const percentage = all.length > 0 ? (all.filter((t) => t.is_completed).length / all.length) * 100 : 0;
  await supabase
    .from("freelance_projects")
    .update({ completion_percentage: Number(percentage.toFixed(2)) })
    .eq("id", task.project_id)
    .eq("user_id", userId);
}

export async function deleteTask(supabase: SupabaseClient, task: ProjectTaskRow): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("project_tasks").delete().eq("id", task.id).eq("user_id", userId);
  const { data: tasks } = await supabase.from("project_tasks").select("is_completed").eq("project_id", task.project_id);
  const all = (tasks ?? []) as { is_completed: boolean }[];
  const percentage = all.length > 0 ? (all.filter((t) => t.is_completed).length / all.length) * 100 : 0;
  await supabase
    .from("freelance_projects")
    .update({ completion_percentage: Number(percentage.toFixed(2)) })
    .eq("id", task.project_id)
    .eq("user_id", userId);
}

// ─── Zaman Takibi ───────────────────────────────────────────────────────────

export async function getActiveTimeLog(
  supabase: SupabaseClient,
  businessId: string,
): Promise<FreelanceTimeLogRow | null> {
  try {
    const { data } = await supabase
      .from("freelance_time_logs")
      .select("*")
      .eq("business_id", businessId)
      .is("ended_at", null)
      .maybeSingle();
    return (data as FreelanceTimeLogRow) ?? null;
  } catch {
    return null;
  }
}

export async function getRecentTimeLogs(
  supabase: SupabaseClient,
  businessId: string,
  limit = 20,
): Promise<FreelanceTimeLogRow[]> {
  try {
    const { data } = await supabase
      .from("freelance_time_logs")
      .select("*")
      .eq("business_id", businessId)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as FreelanceTimeLogRow[];
  } catch {
    return [];
  }
}

export async function startTimeLog(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; projectId: string; taskId: string | null; description: string | null; hourlyRate: number },
): Promise<void> {
  await supabase.from("freelance_time_logs").insert({
    project_id: payload.projectId,
    business_id: payload.businessId,
    user_id: payload.userId,
    task_id: payload.taskId,
    description: payload.description,
    hourly_rate: payload.hourlyRate,
  });
}

export async function stopTimeLog(supabase: SupabaseClient, log: FreelanceTimeLogRow): Promise<void> {
  const userId = await requireUserId(supabase);
  const endedAt = new Date();
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - new Date(log.started_at).getTime()) / 60000));
  const totalAmount = Number(((durationMinutes / 60) * Number(log.hourly_rate)).toFixed(2));
  await supabase
    .from("freelance_time_logs")
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes, total_amount: totalAmount })
    .eq("id", log.id)
    .eq("user_id", userId);
}

// ─── Proje Masrafları ───────────────────────────────────────────────────────

export async function getProjectExpenses(supabase: SupabaseClient, projectId: string): Promise<ProjectExpenseRow[]> {
  try {
    const { data } = await supabase
      .from("project_expenses")
      .select("*")
      .eq("project_id", projectId)
      .order("expense_date", { ascending: false });
    return (data ?? []) as ProjectExpenseRow[];
  } catch {
    return [];
  }
}

export async function addProjectExpense(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    projectId: string;
    category: string;
    description: string | null;
    amount: number;
    expenseDate: string;
    isAiScanned?: boolean;
  },
): Promise<void> {
  await supabase.from("project_expenses").insert({
    project_id: payload.projectId,
    business_id: payload.businessId,
    user_id: payload.userId,
    category: payload.category,
    description: payload.description,
    amount: payload.amount,
    expense_date: payload.expenseDate,
    is_ai_scanned: payload.isAiScanned ?? false,
  });
}

export async function deleteProjectExpense(supabase: SupabaseClient, id: string): Promise<void> {
  const userId = await requireUserId(supabase);
  await supabase.from("project_expenses").delete().eq("id", id).eq("user_id", userId);
}
