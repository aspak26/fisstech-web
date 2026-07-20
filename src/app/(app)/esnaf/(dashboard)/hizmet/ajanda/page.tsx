import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getAppointmentsForDay, getHizmetCustomers, getServiceCatalog } from "@/lib/data/hizmet";
import { getEmployees } from "@/lib/data/esnaf";
import { HizmetDayNav } from "@/components/modules/esnaf/hizmet-day-nav";
import { HizmetAjanda } from "@/components/modules/esnaf/hizmet-ajanda";

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default async function HizmetAjandaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? todayString();

  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [appointments, customers, catalog, employees] = await Promise.all([
    getAppointmentsForDay(supabase, business.id, dayStart.toISOString(), dayEnd.toISOString()),
    getHizmetCustomers(supabase, business.id),
    getServiceCatalog(supabase, business.id),
    getEmployees(supabase, business.id),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold text-text-primary">Ajanda</h1>
      <Suspense fallback={<div className="h-9" />}>
        <HizmetDayNav date={date} />
      </Suspense>
      <HizmetAjanda
        businessId={business.id}
        date={date}
        appointments={appointments}
        customers={customers}
        catalog={catalog}
        employees={employees}
      />
    </div>
  );
}
