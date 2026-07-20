import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AppointmentRow,
  HizmetCustomerRow,
  MaintenanceReminder,
  ServiceCatalogRow,
  ServiceJobPartRow,
  ServiceJobRow,
  ServiceJobStatus,
} from "@/lib/types/esnaf";

// ─── Müşteriler ─────────────────────────────────────────────────────────────

export async function getHizmetCustomers(
  supabase: SupabaseClient,
  businessId: string,
): Promise<HizmetCustomerRow[]> {
  try {
    const { data } = await supabase
      .from("hizmet_customers")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    return (data ?? []) as HizmetCustomerRow[];
  } catch {
    return [];
  }
}

export async function createHizmetCustomer(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    name: string;
    phone: string | null;
    notes: string | null;
    vehiclePlate: string | null;
    deviceModel: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("hizmet_customers")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      name: payload.name,
      phone: payload.phone,
      notes: payload.notes,
      vehicle_plate: payload.vehiclePlate,
      device_model: payload.deviceModel,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Müşteri eklenemedi");
  return data.id as string;
}

export async function updateHizmetCustomer(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Pick<HizmetCustomerRow, "name" | "phone" | "notes" | "vehicle_plate" | "device_model">>,
): Promise<void> {
  await supabase
    .from("hizmet_customers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteHizmetCustomer(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("hizmet_customers").delete().eq("id", id);
}

// ─── Hizmet Kataloğu ────────────────────────────────────────────────────────

export async function getServiceCatalog(
  supabase: SupabaseClient,
  businessId: string,
): Promise<ServiceCatalogRow[]> {
  try {
    const { data } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name");
    return (data ?? []) as ServiceCatalogRow[];
  } catch {
    return [];
  }
}

export async function createServiceCatalogItem(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; name: string; defaultPrice: number; durationMinutes: number },
): Promise<void> {
  await supabase.from("service_catalog").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    name: payload.name,
    default_price: payload.defaultPrice,
    duration_minutes: payload.durationMinutes,
  });
}

export async function updateServiceCatalogItem(
  supabase: SupabaseClient,
  id: string,
  patch: { name?: string; defaultPrice?: number; durationMinutes?: number },
): Promise<void> {
  await supabase
    .from("service_catalog")
    .update({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.defaultPrice !== undefined ? { default_price: patch.defaultPrice } : {}),
      ...(patch.durationMinutes !== undefined ? { duration_minutes: patch.durationMinutes } : {}),
    })
    .eq("id", id);
}

export async function deleteServiceCatalogItem(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("service_catalog").delete().eq("id", id);
}

// ─── Ajanda (Randevular) ────────────────────────────────────────────────────

export async function getAppointmentsForDay(
  supabase: SupabaseClient,
  businessId: string,
  dayStartISO: string,
  dayEndISO: string,
): Promise<AppointmentRow[]> {
  try {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", businessId)
      .gte("appointment_start", dayStartISO)
      .lt("appointment_start", dayEndISO)
      .order("appointment_start");
    return (data ?? []) as AppointmentRow[];
  } catch {
    return [];
  }
}

export async function getUpcomingAppointment(
  supabase: SupabaseClient,
  businessId: string,
): Promise<AppointmentRow | null> {
  try {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", businessId)
      .gte("appointment_start", new Date().toISOString())
      .order("appointment_start")
      .limit(1)
      .maybeSingle();
    return (data as AppointmentRow) ?? null;
  } catch {
    return null;
  }
}

export async function createAppointment(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customerId: string | null;
    staffId: string | null;
    serviceCatalogId: string | null;
    start: string;
    end: string | null;
    notes: string | null;
  },
): Promise<void> {
  await supabase.from("appointments").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    customer_id: payload.customerId,
    staff_id: payload.staffId,
    service_catalog_id: payload.serviceCatalogId,
    appointment_start: payload.start,
    appointment_end: payload.end,
    notes: payload.notes,
  });
}

// ─── Atölye (İş Emirleri) ───────────────────────────────────────────────────

export async function getOpenServiceJobs(
  supabase: SupabaseClient,
  businessId: string,
): Promise<ServiceJobRow[]> {
  try {
    const { data } = await supabase
      .from("service_jobs")
      .select("*")
      .eq("business_id", businessId)
      .neq("status", "tamamlandi")
      .order("created_at", { ascending: false });
    return (data ?? []) as ServiceJobRow[];
  } catch {
    return [];
  }
}

export interface NewServiceJobPart {
  partName: string;
  quantity: number;
  unitCost: number;
}

export async function createServiceJob(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customerId: string | null;
    staffId: string | null;
    title: string;
    laborCost: number;
    paymentMethod: string;
    parts: NewServiceJobPart[];
    notes: string | null;
  },
): Promise<string> {
  const partsCost = payload.parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);
  const { data: created, error } = await supabase
    .from("service_jobs")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      customer_id: payload.customerId,
      staff_id: payload.staffId,
      title: payload.title,
      labor_cost: payload.laborCost,
      parts_cost: partsCost,
      total_amount: payload.laborCost + partsCost,
      payment_method: payload.paymentMethod,
      notes: payload.notes,
    })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("İş emri oluşturulamadı");

  const jobId = created.id as string;
  if (payload.parts.length > 0) {
    await supabase.from("service_job_parts").insert(
      payload.parts.map((p) => ({
        job_id: jobId,
        business_id: payload.businessId,
        user_id: payload.userId,
        part_name: p.partName,
        quantity: p.quantity,
        unit_cost: p.unitCost,
        total_cost: p.quantity * p.unitCost,
      })),
    );
  }
  return jobId;
}

export async function getServiceJobParts(
  supabase: SupabaseClient,
  jobId: string,
): Promise<ServiceJobPartRow[]> {
  try {
    const { data } = await supabase.from("service_job_parts").select("*").eq("job_id", jobId);
    return (data ?? []) as ServiceJobPartRow[];
  } catch {
    return [];
  }
}

export async function updateServiceJobStatus(
  supabase: SupabaseClient,
  id: string,
  status: ServiceJobStatus,
): Promise<void> {
  await supabase
    .from("service_jobs")
    .update({ status, ...(status === "tamamlandi" ? { completed_at: new Date().toISOString() } : {}) })
    .eq("id", id);
}

// ─── Pano ───────────────────────────────────────────────────────────────────

export async function getTodayServiceRevenue(
  supabase: SupabaseClient,
  businessId: string,
  dayStartISO: string,
  dayEndISO: string,
): Promise<{ total: number; count: number }> {
  try {
    const { data } = await supabase
      .from("service_jobs")
      .select("total_amount")
      .eq("business_id", businessId)
      .gte("completed_at", dayStartISO)
      .lt("completed_at", dayEndISO);
    const rows = (data ?? []) as { total_amount: number }[];
    return { total: rows.reduce((s, r) => s + Number(r.total_amount), 0), count: rows.length };
  } catch {
    return { total: 0, count: 0 };
  }
}

// ─── Akıllı Bildirimler (bakım hatırlatmaları) ─────────────────────────────

/** Ported from mobile's ServiceJobService.getMaintenanceReminders — for each
 * customer's most recently completed job (within the last 210 days), flags
 * it as a reminder if it falls in one of three "about due" windows
 * (~monthly / ~3-monthly / ~6-monthly maintenance cadence). */
export async function getMaintenanceReminders(
  supabase: SupabaseClient,
  businessId: string,
): Promise<MaintenanceReminder[]> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 210);

    const { data } = await supabase
      .from("service_jobs")
      .select("id, title, completed_at, customer_id, hizmet_customers(name, phone, vehicle_plate)")
      .eq("business_id", businessId)
      .eq("status", "tamamlandi")
      .not("customer_id", "is", null)
      .gte("completed_at", cutoff.toISOString())
      .order("completed_at", { ascending: false });

    interface Row {
      id: string;
      title: string;
      completed_at: string | null;
      customer_id: string;
      hizmet_customers: { name: string; phone: string | null; vehicle_plate: string | null } | null;
    }
    const rows = ((data ?? []) as unknown as (Omit<Row, "hizmet_customers"> & {
      hizmet_customers: Row["hizmet_customers"] | Row["hizmet_customers"][];
    })[]).map((r) => ({
      ...r,
      hizmet_customers: Array.isArray(r.hizmet_customers) ? (r.hizmet_customers[0] ?? null) : r.hizmet_customers,
    }));

    // Her müşteri için en son tamamlanan işi tut (zaten completed_at desc sıralı).
    const latestByCustomer = new Map<string, Row>();
    for (const row of rows) {
      if (!latestByCustomer.has(row.customer_id)) latestByCustomer.set(row.customer_id, row);
    }

    const now = Date.now();
    const reminders: MaintenanceReminder[] = [];
    for (const row of latestByCustomer.values()) {
      if (!row.completed_at) continue;
      const days = Math.floor((now - new Date(row.completed_at).getTime()) / 86400000);

      let label: string | null = null;
      if (days >= 25 && days <= 42) label = "aylık bakım";
      else if (days >= 85 && days <= 100) label = "3 aylık bakım";
      else if (days >= 160 && days <= 200) label = "6 aylık bakım";
      if (!label) continue;

      reminders.push({
        customerId: row.customer_id,
        customerName: row.hizmet_customers?.name ?? "Müşteri",
        customerPhone: row.hizmet_customers?.phone ?? null,
        customerVehiclePlate: row.hizmet_customers?.vehicle_plate ?? null,
        lastService: row.title,
        completedAt: row.completed_at,
        daysSince: days,
        intervalLabel: label,
      });
    }
    return reminders;
  } catch {
    return [];
  }
}
