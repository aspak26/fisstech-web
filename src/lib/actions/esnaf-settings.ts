"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

/**
 * Mağazayı kökten siler.
 * Supabase ON DELETE CASCADE sayesinde altındaki her şey silinir.
 */
export async function deleteBusinessAction(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", businessId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Mağaza silinirken hata:", error);
    return { success: false, error: "Mağaza silinemedi." };
  }

  // Aktif mağaza çerezini sil
  const cookieStore = await cookies();
  cookieStore.delete("esnaf_active_business_id");

  return { success: true };
}

/**
 * İşletme kurulumunu (business_service_chips, product_categories, business_staff vs.) koruyarak,
 * işlem (transaction) ve fiş / kayıt seviyesindeki tüm verileri sıfırlar.
 */
export async function resetBusinessDataAction(businessId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  try {
    // 1. Ortak modül tabloları
    await supabase.from("business_incomes").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("business_expenses").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("business_invoices").delete().eq("business_id", businessId).eq("user_id", user.id);
    
    // Personel ve stok tabloları (Mobilde de siliniyor)
    await supabase.from("business_employees").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("stocks").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("stock_movements").delete().eq("business_id", businessId).eq("user_id", user.id);

    // 2. Satış modülü
    await supabase.from("sale_portfolios").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("sale_processes").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("sale_customers").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("sale_documents").delete().eq("business_id", businessId).eq("user_id", user.id);

    // 3. Hizmet modülü
    await supabase.from("service_jobs").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("hizmet_appointments").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("hizmet_customers").delete().eq("business_id", businessId).eq("user_id", user.id);

    // 4. Perakende modülü
    await supabase.from("perakende_transactions").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("perakende_debts").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("perakende_customers").delete().eq("business_id", businessId).eq("user_id", user.id);
    
    // 5. Freelance modülü
    await supabase.from("freelance_projects").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("freelance_clients").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("freelance_time_logs").delete().eq("business_id", businessId).eq("user_id", user.id);

    // 6. Toptan modülü
    await supabase.from("wholesale_orders").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("b2b_transactions").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("b2b_payments").delete().eq("business_id", businessId).eq("user_id", user.id);
    await supabase.from("b2b_customers").delete().eq("business_id", businessId).eq("user_id", user.id);

    return { success: true };
  } catch (error) {
    console.error("Veri sıfırlanırken hata:", error);
    return { success: false, error: "Veriler sıfırlanırken bir hata oluştu." };
  }
}
