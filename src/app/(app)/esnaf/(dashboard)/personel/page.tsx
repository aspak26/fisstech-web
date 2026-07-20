import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/esnaf/active-business";
import { getEmployees, getSalaryPayments, ensureSalaryRecords } from "@/lib/data/esnaf";
import { getStaffCommissionSummary } from "@/lib/data/hizmet";
import { currentMonthString } from "@/lib/utils/date";
import { PersonelList } from "@/components/modules/esnaf/personel-list";

export default async function EsnafPersonelPage() {
  const business = await getActiveBusiness();
  if (!business) return null;

  const supabase = await createClient();
  const employees = await getEmployees(supabase, business.id);

  const month = currentMonthString();
  await ensureSalaryRecords(supabase, business.id, business.user_id, employees, month);
  const [salaryPayments, commissionSummary] = await Promise.all([
    getSalaryPayments(supabase, business.id, month),
    getStaffCommissionSummary(supabase, business.id, month),
  ]);

  return (
    <div>
      <h1 className="mb-4 font-display text-xl font-semibold text-text-primary">
        Personel & Maaş
      </h1>
      <PersonelList
        business={business}
        employees={employees}
        salaryPayments={salaryPayments}
        commissionSummary={commissionSummary}
      />
    </div>
  );
}
