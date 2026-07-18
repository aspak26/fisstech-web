import { createClient } from "@/lib/supabase/server";
import { getReportData } from "@/lib/data/reports";
import { ReportPeriodSelector } from "@/components/modules/reports/report-period-selector";
import { ReportView } from "@/components/modules/reports/report-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;

  if (!start || !end) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ReportPeriodSelector />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = await getReportData(supabase, user!.id, start, end);

  return (
    <div className="mx-auto max-w-4xl">
      <ReportView data={data} />
    </div>
  );
}
