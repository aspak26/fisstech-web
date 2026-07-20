"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { AppointmentRow, EmployeeRow, HizmetCustomerRow, ServiceCatalogRow } from "@/lib/types/esnaf";
import { HizmetSihirbazDialog } from "./hizmet-sihirbaz-dialog";

const SLOT_MINUTES = 30;
const START_HOUR = 8;
const END_HOUR = 21.5;

function buildSlots(date: string): Date[] {
  const slots: Date[] = [];
  const base = new Date(`${date}T00:00:00`);
  let minutes = START_HOUR * 60;
  const endMinutes = END_HOUR * 60;
  while (minutes <= endMinutes) {
    const slot = new Date(base);
    slot.setMinutes(minutes);
    slots.push(slot);
    minutes += SLOT_MINUTES;
  }
  return slots;
}

const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function HizmetAjanda({
  businessId,
  date,
  appointments,
  customers,
  catalog,
  employees,
}: {
  businessId: string;
  date: string;
  appointments: AppointmentRow[];
  customers: HizmetCustomerRow[];
  catalog: ServiceCatalogRow[];
  employees: EmployeeRow[];
}) {
  const [preStartTime, setPreStartTime] = useState<string | null>(null);
  const slots = useMemo(() => buildSlots(date), [date]);
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const serviceMap = new Map(catalog.map((s) => [s.id, s]));

  function appointmentAt(slot: Date): AppointmentRow | undefined {
    return appointments.find((a) => {
      const start = new Date(a.appointment_start);
      return start.getTime() === slot.getTime();
    });
  }

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <ul className="divide-y divide-border">
          {slots.map((slot) => {
            const appointment = appointmentAt(slot);
            const customer = appointment?.customer_id ? customerMap.get(appointment.customer_id) : null;
            const service = appointment?.service_catalog_id ? serviceMap.get(appointment.service_catalog_id) : null;
            return (
              <li key={slot.toISOString()} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-14 shrink-0 text-sm text-text-secondary">{timeFmt.format(slot)}</span>
                {appointment ? (
                  <div className="min-w-0 flex-1 rounded-control bg-accent/10 px-3 py-2">
                    <p className="truncate text-sm font-medium text-accent">
                      {customer?.name ?? "Müşterisiz"} {service ? `· ${service.name}` : ""}
                    </p>
                    {appointment.notes && <p className="truncate text-xs text-text-secondary">{appointment.notes}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPreStartTime(slot.toISOString())}
                    className={cn(
                      "flex flex-1 items-center gap-1.5 rounded-control px-3 py-2 text-sm text-text-secondary",
                      "hover:bg-bg hover:text-accent",
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" /> Randevu ekle
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {preStartTime && (
        <HizmetSihirbazDialog
          open={!!preStartTime}
          onClose={() => setPreStartTime(null)}
          businessId={businessId}
          customers={customers}
          catalog={catalog}
          employees={employees}
          preStartTime={preStartTime}
        />
      )}
    </div>
  );
}
