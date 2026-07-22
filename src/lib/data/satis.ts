import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PortfolioCategory,
  SaleCustomerRow,
  SaleInstallmentRow,
  SalePortfolioRow,
  SaleTransactionRow,
} from "@/lib/types/esnaf";

// ─── Portföy ────────────────────────────────────────────────────────────────

export async function getSalePortfolios(supabase: SupabaseClient, businessId: string): Promise<SalePortfolioRow[]> {
  try {
    const { data } = await supabase
      .from("sale_portfolios")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    return (data ?? []) as SalePortfolioRow[];
  } catch {
    return [];
  }
}

export async function createSalePortfolio(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    title: string;
    category: PortfolioCategory;
    description: string | null;
    listPrice: number;
    costPrice: number | null;
    notes: string | null;
  },
): Promise<void> {
  await supabase.from("sale_portfolios").insert({
    business_id: payload.businessId,
    user_id: payload.userId,
    title: payload.title,
    category: payload.category,
    description: payload.description,
    list_price: payload.listPrice,
    cost_price: payload.costPrice,
    notes: payload.notes,
  });
}

export async function updateSalePortfolio(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<{
    title: string;
    category: PortfolioCategory;
    description: string | null;
    listPrice: number;
    costPrice: number | null;
    notes: string | null;
    status: "satista" | "rezerve" | "satildi";
  }>,
): Promise<void> {
  await supabase
    .from("sale_portfolios")
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.listPrice !== undefined ? { list_price: patch.listPrice } : {}),
      ...(patch.costPrice !== undefined ? { cost_price: patch.costPrice } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function deleteSalePortfolio(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("sale_portfolios").delete().eq("id", id);
}

// ─── Müşteriler ─────────────────────────────────────────────────────────────

export async function getSaleCustomers(supabase: SupabaseClient, businessId: string): Promise<SaleCustomerRow[]> {
  try {
    const { data } = await supabase
      .from("sale_customers")
      .select("*")
      .eq("business_id", businessId)
      .order("full_name");
    return (data ?? []) as SaleCustomerRow[];
  } catch {
    return [];
  }
}

export async function createSaleCustomer(
  supabase: SupabaseClient,
  payload: { businessId: string; userId: string; fullName: string; phone: string | null; tcOrVat: string | null },
): Promise<string> {
  const { data, error } = await supabase
    .from("sale_customers")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      full_name: payload.fullName,
      phone: payload.phone,
      tc_or_vat: payload.tcOrVat,
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Müşteri eklenemedi");
  return data.id as string;
}

export async function deleteSaleCustomer(supabase: SupabaseClient, id: string): Promise<void> {
  await supabase.from("sale_customers").delete().eq("id", id);
}

// ─── Satış İşlemleri & Taksitler ────────────────────────────────────────────

export async function getSaleTransactions(
  supabase: SupabaseClient,
  businessId: string,
  limit = 200,
): Promise<SaleTransactionRow[]> {
  try {
    const { data } = await supabase
      .from("sale_transactions")
      .select("*")
      .eq("business_id", businessId)
      .order("sale_date", { ascending: false })
      .limit(limit);
    return (data ?? []) as SaleTransactionRow[];
  } catch {
    return [];
  }
}

export async function getSaleInstallments(
  supabase: SupabaseClient,
  businessId: string,
  limit = 300,
): Promise<SaleInstallmentRow[]> {
  try {
    const { data } = await supabase
      .from("sale_installments")
      .select("*")
      .eq("business_id", businessId)
      .order("due_date")
      .limit(limit);
    return (data ?? []) as SaleInstallmentRow[];
  } catch {
    return [];
  }
}

export async function markInstallmentPaid(supabase: SupabaseClient, installment: SaleInstallmentRow): Promise<void> {
  await supabase
    .from("sale_installments")
    .update({ is_paid: true, paid_date: new Date().toISOString().slice(0, 10), paid_amount: installment.amount })
    .eq("id", installment.id);
}

export interface SaleWizardResult {
  transactionId: string;
  installments: { installmentNo: number; amount: number; dueDate: string }[];
}

/** Bir satışı kaydeder: sale_transactions + (taksitliyse) sale_installments,
 * portföyden seçilmişse ürünü 'satildi' işaretler — mobildeki
 * SaleWizardScreen'in kayıt adımıyla aynı. */
export async function createSaleTransaction(
  supabase: SupabaseClient,
  payload: {
    businessId: string;
    userId: string;
    customerId: string | null;
    portfolioItemId: string | null;
    staffEmployeeId: string | null;
    totalAmount: number;
    downPayment: number;
    paymentType: "tek_cekim" | "taksitli";
    installmentCount: number;
    firstInstallmentDate: string | null;
    notes: string | null;
  },
): Promise<SaleWizardResult> {
  const remaining = payload.totalAmount - payload.downPayment;

  const { data: created, error } = await supabase
    .from("sale_transactions")
    .insert({
      business_id: payload.businessId,
      user_id: payload.userId,
      portfolio_item_id: payload.portfolioItemId,
      customer_id: payload.customerId,
      staff_employee_id: payload.staffEmployeeId,
      total_amount: payload.totalAmount,
      down_payment: payload.downPayment,
      remaining_amount: payload.paymentType === "taksitli" ? remaining : 0,
      payment_type: payload.paymentType,
      installment_count: payload.paymentType === "taksitli" ? payload.installmentCount : 1,
      notes: payload.notes,
    })
    .select("id")
    .single();
  if (error || !created) throw error ?? new Error("Satış kaydedilemedi");

  const transactionId = created.id as string;
  const installments: SaleWizardResult["installments"] = [];

  if (payload.paymentType === "taksitli" && payload.firstInstallmentDate) {
    const perInstallment = Number((remaining / payload.installmentCount).toFixed(2));
    const start = new Date(`${payload.firstInstallmentDate}T00:00:00`);
    const rows = Array.from({ length: payload.installmentCount }, (_, i) => {
      const due = new Date(start.getFullYear(), start.getMonth() + i, start.getDate());
      const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
      installments.push({ installmentNo: i + 1, amount: perInstallment, dueDate });
      return {
        transaction_id: transactionId,
        business_id: payload.businessId,
        user_id: payload.userId,
        installment_no: i + 1,
        amount: perInstallment,
        due_date: dueDate,
      };
    });
    await supabase.from("sale_installments").insert(rows);
  }

  if (payload.portfolioItemId) {
    await updateSalePortfolio(supabase, payload.portfolioItemId, {
      status: "satildi",
    });
    await supabase.from("sale_portfolios").update({ sold_price: payload.totalAmount }).eq("id", payload.portfolioItemId);
  }

  return { transactionId, installments };
}
