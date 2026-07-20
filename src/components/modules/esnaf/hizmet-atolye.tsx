"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, MessageCircle, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils/currency";
import { whatsappLink } from "@/lib/esnaf/whatsapp";
import { updateServiceJobStatus } from "@/lib/data/hizmet";
import type { EmployeeRow, HizmetCustomerRow, ServiceCatalogRow, ServiceJobRow, ServiceJobStatus } from "@/lib/types/esnaf";
import { HizmetSihirbazDialog } from "./hizmet-sihirbaz-dialog";
import { ServiceJobCompleteDialog } from "./service-job-complete-dialog";

const COLUMNS: { status: ServiceJobStatus; title: string; nextLabel: string | null; next: ServiceJobStatus | null }[] = [
  { status: "bekliyor", title: "Bekliyor", nextLabel: "Başlat", next: "devam" },
  { status: "devam", title: "Devam", nextLabel: "Teslime Hazır", next: "hazir" },
  { status: "hazir", title: "Hazır", nextLabel: "Tamamla", next: "tamamlandi" },
];

export function HizmetAtolye({
  businessId,
  jobs,
  customers,
  employees,
  catalog,
}: {
  businessId: string;
  jobs: ServiceJobRow[];
  customers: HizmetCustomerRow[];
  employees: EmployeeRow[];
  catalog: ServiceCatalogRow[];
}) {
  const router = useRouter();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [completingJob, setCompletingJob] = useState<ServiceJobRow | null>(null);
  const [completedNotice, setCompletedNotice] = useState<{ job: ServiceJobRow; phone: string } | null>(null);

  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const staffMap = new Map(employees.map((e) => [e.id, e]));

  async function advance(job: ServiceJobRow, next: ServiceJobStatus) {
    if (next === "tamamlandi") {
      setCompletingJob(job);
      return;
    }
    await updateServiceJobStatus(createClient(), job.id, next);
    router.refresh();
  }

  function handleJobCompleted() {
    const job = completingJob;
    if (job) {
      const customer = job.customer_id ? customerMap.get(job.customer_id) : null;
      if (customer?.phone) setCompletedNotice({ job, phone: customer.phone });
    }
    setCompletingJob(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni İş
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnJobs = jobs.filter((j) => j.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
                {col.title} <span className="text-text-secondary">({columnJobs.length})</span>
              </h2>
              <div className="space-y-2">
                {columnJobs.length === 0 ? (
                  <Card className="p-4 text-center text-sm text-text-secondary">Boş</Card>
                ) : (
                  columnJobs.map((job) => {
                    const customer = job.customer_id ? customerMap.get(job.customer_id) : null;
                    const staff = job.staff_id ? staffMap.get(job.staff_id) : null;
                    return (
                      <Card key={job.id} className="space-y-2 p-3">
                        <p className="font-medium text-text-primary">{job.title}</p>
                        <p className="text-sm text-text-secondary">
                          {customer?.name ?? "Müşterisiz"}
                          {staff ? ` · ${staff.full_name}` : ""}
                        </p>
                        <p className="font-medium text-text-primary">{formatCurrency(Number(job.total_amount))}</p>
                        {col.next && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => advance(job, col.next!)}
                          >
                            {col.nextLabel} <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <EmptyState icon={Wrench} title="Henüz iş emri yok" description="Yeni İş ile ilk iş emrini oluştur." />
      )}

      <HizmetSihirbazDialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        businessId={businessId}
        customers={customers}
        catalog={catalog}
        employees={employees}
      />

      <ServiceJobCompleteDialog
        job={completingJob}
        businessId={businessId}
        employees={employees}
        onClose={() => setCompletingJob(null)}
        onCompleted={handleJobCompleted}
      />

      {completedNotice && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-xl">
          <p className="text-sm text-text-primary">İş tamamlandı — müşteriye haber ver mi?</p>
          <div className="flex shrink-0 gap-2">
            <a
              href={whatsappLink(
                completedNotice.phone,
                `Merhaba, "${completedNotice.job.title}" işiniz tamamlandı, teslime hazır. Toplam tutar: ${formatCurrency(Number(completedNotice.job.total_amount))}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-control bg-success px-3 py-2 text-sm font-medium text-white"
              onClick={() => setCompletedNotice(null)}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Gönder
            </a>
            <button
              type="button"
              onClick={() => setCompletedNotice(null)}
              className="rounded-control px-3 py-2 text-sm text-text-secondary hover:bg-bg"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
