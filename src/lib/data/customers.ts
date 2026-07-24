import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUserId } from "@/lib/utils/auth";

export interface UniversalCustomerRow {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  type_specific_data?: any; // Plaka, vergi no, vs
}

export async function getUniversalCustomers(
  supabase: SupabaseClient,
  businessId: string,
  businessType: string
): Promise<UniversalCustomerRow[]> {
  try {
    switch (businessType) {
      case "hizmet": {
        const { data } = await supabase
          .from("hizmet_customers")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        return (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          notes: r.notes,
          type_specific_data: { vehicle_plate: r.vehicle_plate },
        }));
      }
      case "perakende": {
        const { data } = await supabase
          .from("perakende_customers")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        return (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          notes: r.notes,
          type_specific_data: { current_debt: r.current_debt },
        }));
      }
      case "toptan": {
        const { data } = await supabase
          .from("b2b_customers")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        return (data || []).map((r: any) => ({
          id: r.id,
          name: r.company_name,
          phone: r.phone,
          notes: r.notes,
          type_specific_data: { tax_no: r.tax_no, credit_limit: r.credit_limit, current_debt: r.current_debt },
        }));
      }
      case "freelance": {
        const { data } = await supabase
          .from("freelance_clients")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        return (data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          notes: r.notes,
          type_specific_data: { company: r.company_name, email: r.email },
        }));
      }
      case "satis": {
        const { data } = await supabase
          .from("sale_customers")
          .select("*")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false });
        return (data || []).map((r: any) => ({
          id: r.id,
          name: r.full_name,
          phone: r.phone,
          notes: r.notes,
          type_specific_data: { email: r.email, budget: r.budget_max },
        }));
      }
      default:
        // Kafe doesn't have customers usually, or other unhandled types
        return [];
    }
  } catch (error) {
    console.error("Error fetching universal customers:", error);
    return [];
  }
}
