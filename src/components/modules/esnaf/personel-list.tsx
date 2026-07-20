"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteButton } from "@/components/ui/delete-button";
import { formatCurrency } from "@/lib/utils/currency";
import { deleteEmployee, toggleSalaryPaid } from "@/lib/data/esnaf";
import type { StaffCommissionSummary } from "@/lib/data/hizmet";
import type { BusinessRow, EmployeeRow, SalaryPaymentRow } from "@/lib/types/esnaf";
import { EmployeeFormDialog } from "./employee-form-dialog";

export function PersonelList({
  business,
  employees,
  salaryPayments,
  commissionSummary,
}: {
  business: BusinessRow;
  employees: EmployeeRow[];
  salaryPayments: SalaryPaymentRow[];
  commissionSummary: StaffCommissionSummary[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const paymentByEmployee = new Map(salaryPayments.map((s) => [s.employee_id, s]));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Personel Ekle
        </Button>
      </div>

      <Card>
        {employees.length === 0 ? (
          <EmptyState icon={Users} title="Henüz personel eklenmedi" />
        ) : (
          <ul className="divide-y divide-border">
            {employees.map((emp) => {
              const payment = paymentByEmployee.get(emp.id);
              return (
                <li key={emp.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={emp.full_name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-primary">{emp.full_name}</p>
                      <p className="text-sm text-text-secondary">
                        {emp.role || "Personel"} · Her ayın {emp.salary_day}. günü
                      </p>
                    </div>
                  </div>
                  {payment && (
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleSalaryPaid(createClient(), payment.id, !payment.is_paid);
                        router.refresh();
                      }}
                    >
                      <Badge tone={payment.is_paid ? "success" : "neutral"}>
                        {payment.is_paid ? "Maaş Ödendi" : "Maaş Bekliyor"}
                      </Badge>
                    </button>
                  )}
                  <span className="font-medium text-text-primary">
                    {formatCurrency(Number(emp.salary))}
                  </span>
                  <DeleteButton
                    confirmMessage={`"${emp.full_name}" silinsin mi?`}
                    onDelete={() => deleteEmployee(createClient(), emp.id)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {commissionSummary.length > 0 && (
        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-text-primary">Bu Ay Primler</h2>
          <ul className="divide-y divide-border">
            {commissionSummary.map((c) => (
              <li key={c.staffId} className="flex items-center justify-between py-2.5">
                <span className="text-text-primary">{c.name}</span>
                <span className="font-medium text-accent">{formatCurrency(c.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <EmployeeFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} business={business} />
    </div>
  );
}
