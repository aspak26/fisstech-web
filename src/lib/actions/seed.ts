"use server";

import { createClient } from "@/lib/supabase/server";

export async function seedTestScenariosAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Oturum bulunamadı." };
  }

  const userId = user.id;

  try {
    // -------------------------------------------------------------------------
    // 1. Hizmet & Bakım: "Parlayan Oto Yıkama"
    // -------------------------------------------------------------------------
    const b1_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b1_id,
      user_id: userId,
      name: "Parlayan Oto Yıkama",
      sector: "hizmet_bakim",
      business_type: "hizmet",
      currency: "TRY",
      vat_enabled: true,
      default_vat: 20
    });

    const b1_chip1 = crypto.randomUUID();
    const b1_chip2 = crypto.randomUUID();
    await supabase.from("business_service_chips").insert([
      { id: b1_chip1, business_id: b1_id, user_id: userId, label: "İç-Dış Yıkama", price: 300, sort_order: 1 },
      { id: b1_chip2, business_id: b1_id, user_id: userId, label: "Detaylı Temizlik", price: 1500, sort_order: 2 }
    ]);

    const b1_staff = crypto.randomUUID();
    await supabase.from("business_employees").insert({
      id: b1_staff, business_id: b1_id, user_id: userId, full_name: "Ahmet Usta", role: "Yıkama Ustası", salary: 25000, salary_day: 1
    });

    const b1_customer = crypto.randomUUID();
    await supabase.from("hizmet_customers").insert({
      id: b1_customer, business_id: b1_id, user_id: userId, name: "Ali Yılmaz", vehicle_plate: "34 ABC 123", phone: "5551112233"
    });

    const b1_catalog = crypto.randomUUID();
    await supabase.from("service_catalogs").insert({
      id: b1_catalog, business_id: b1_id, user_id: userId, name: "Seramik Kaplama", default_price: 2000, duration_minutes: 120, is_active: true
    });

    const b1_appointment = crypto.randomUUID();
    await supabase.from("hizmet_appointments").insert({
      id: b1_appointment, business_id: b1_id, user_id: userId, customer_id: b1_customer, staff_id: b1_staff, service_catalog_id: b1_catalog,
      appointment_start: new Date().toISOString(), status: "onaylandi"
    });

    await supabase.from("service_jobs").insert({
      id: crypto.randomUUID(), business_id: b1_id, user_id: userId, customer_id: b1_customer, appointment_id: b1_appointment, staff_id: b1_staff,
      title: "Seramik Kaplama İşlemi", labor_cost: 1500, parts_cost: 500, total_amount: 2000, payment_method: "nakit", status: "devam", is_ai_scanned: false, vehicle_plate: "34 ABC 123"
    });


    // -------------------------------------------------------------------------
    // 2. Hızlı Perakende: "Bizim Mahalle Bakkalı"
    // -------------------------------------------------------------------------
    const b2_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b2_id, user_id: userId, name: "Bizim Mahalle Bakkalı", sector: "hizli_perakende", business_type: "perakende", currency: "TRY", vat_enabled: true, default_vat: 1
    });

    const b2_cat1 = crypto.randomUUID();
    const b2_cat2 = crypto.randomUUID();
    await supabase.from("product_categories").insert([
      { id: b2_cat1, business_id: b2_id, user_id: userId, name: "Gıda", emoji: "🍞", sort_order: 1 },
      { id: b2_cat2, business_id: b2_id, user_id: userId, name: "Temizlik", emoji: "🧼", sort_order: 2 }
    ]);

    await supabase.from("quick_products").insert([
      { id: crypto.randomUUID(), business_id: b2_id, user_id: userId, category_id: b2_cat1, name: "Ekmek", price: 10, unit_type: "adet", has_variations: false, sale_count: 50, is_active: true },
      { id: crypto.randomUUID(), business_id: b2_id, user_id: userId, category_id: b2_cat1, name: "Süt", price: 35, unit_type: "litre", has_variations: false, sale_count: 20, is_active: true },
      { id: crypto.randomUUID(), business_id: b2_id, user_id: userId, category_id: b2_cat2, name: "Deterjan", price: 150, unit_type: "adet", has_variations: false, sale_count: 5, is_active: true }
    ]);

    const b2_customer = crypto.randomUUID();
    await supabase.from("perakende_customers").insert({
      id: b2_customer, business_id: b2_id, user_id: userId, name: "Ayşe Teyze", phone: "5559998877", notes: "Açık hesap"
    });

    await supabase.from("perakende_debts").insert({
      id: crypto.randomUUID(), business_id: b2_id, user_id: userId, customer_id: b2_customer, amount: 350, description: "Ekmek ve peynir", debt_date: new Date().toISOString()
    });


    // -------------------------------------------------------------------------
    // 3. Yeme & İçme: "Lezzet Durağı Lokantası"
    // -------------------------------------------------------------------------
    const b3_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b3_id, user_id: userId, name: "Lezzet Durağı Lokantası", sector: "yeme_icme", business_type: "kafe", currency: "TRY", vat_enabled: true, default_vat: 10
    });

    await supabase.from("business_employees").insert([
      { id: crypto.randomUUID(), business_id: b3_id, user_id: userId, full_name: "Mehmet", role: "Aşçı", salary: 30000, salary_day: 1 },
      { id: crypto.randomUUID(), business_id: b3_id, user_id: userId, full_name: "Zeynep", role: "Garson", salary: 20000, salary_day: 1 }
    ]);

    await supabase.from("business_expenses").insert({
      id: crypto.randomUUID(), business_id: b3_id, user_id: userId, amount: 5000, category: "Gıda Alışverişi", description: "Toptancı Faturası", payment_method: "nakit", vat_rate: 10, vat_amount: 500, expense_date: new Date().toISOString()
    });

    await supabase.from("business_incomes").insert({
      id: crypto.randomUUID(), business_id: b3_id, user_id: userId, amount: 8500, description: "Gün Sonu Z Raporu", payment_method: "kart", vat_rate: 10, vat_amount: 850, transaction_date: new Date().toISOString(), is_quick: false
    });


    // -------------------------------------------------------------------------
    // 4. Yüksek Hacimli Satış: "Prestij Emlak & Otomotiv"
    // -------------------------------------------------------------------------
    const b4_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b4_id, user_id: userId, name: "Prestij Emlak & Otomotiv", sector: "yuksek_hacim", business_type: "satis", currency: "TRY", vat_enabled: false, default_vat: 0
    });

    await supabase.from("sale_portfolios").insert([
      { id: crypto.randomUUID(), business_id: b4_id, user_id: userId, title: "Kadıköy 3+1 Daire", category: "konut", list_price: 4500000, status: "satista" }
    ]);

    const b4_portfolio_sold = crypto.randomUUID();
    await supabase.from("sale_portfolios").insert({
      id: b4_portfolio_sold, business_id: b4_id, user_id: userId, title: "2020 Model Passat", category: "arac", list_price: 1200000, status: "rezerve", sold_price: 1200000
    });

    const b4_customer = crypto.randomUUID();
    await supabase.from("sale_customers").insert({
      id: b4_customer, business_id: b4_id, user_id: userId, full_name: "Hasan Bey", phone: "5553334455"
    });

    const b4_transaction = crypto.randomUUID();
    await supabase.from("sale_transactions").insert({
      id: b4_transaction, business_id: b4_id, user_id: userId, portfolio_item_id: b4_portfolio_sold, customer_id: b4_customer, total_amount: 1200000, down_payment: 200000, remaining_amount: 1000000, payment_type: "taksitli", installment_count: 5, sale_date: new Date().toISOString()
    });

    const installments = [];
    for (let i = 1; i <= 5; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        id: crypto.randomUUID(), transaction_id: b4_transaction, business_id: b4_id, user_id: userId, installment_no: i, amount: 200000, due_date: dueDate.toISOString(), is_paid: false
      });
    }
    await supabase.from("sale_installments").insert(installments);


    // -------------------------------------------------------------------------
    // 5. Toptancı & İmalatçı: "Bereket Toptan Gıda"
    // -------------------------------------------------------------------------
    const b5_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b5_id, user_id: userId, name: "Bereket Toptan Gıda", sector: "toptan_imalat", business_type: "toptan", currency: "TRY", vat_enabled: true, default_vat: 1
    });

    const b5_inv1 = crypto.randomUUID();
    await supabase.from("inventory").insert([
      { id: b5_inv1, business_id: b5_id, user_id: userId, name: "50kg Un Çuvalı", unit_type: "adet", current_stock: 100, critical_level: 20, cost_price: 500, selling_price: 650 },
      { id: crypto.randomUUID(), business_id: b5_id, user_id: userId, name: "10L Sıvı Yağ", unit_type: "adet", current_stock: 50, critical_level: 10, cost_price: 300, selling_price: 400 }
    ]);

    const b5_customer = crypto.randomUUID();
    await supabase.from("b2b_customers").insert({
      id: b5_customer, business_id: b5_id, user_id: userId, company_name: "Merkez Market", credit_limit: 150000, current_debt: 0, risk_level: "low"
    });

    const b5_order = crypto.randomUUID();
    await supabase.from("wholesale_orders").insert({
      id: b5_order, business_id: b5_id, user_id: userId, customer_id: b5_customer, status: "preparing", total_amount: 13000
    });

    await supabase.from("wholesale_order_items").insert({
      id: crypto.randomUUID(), order_id: b5_order, business_id: b5_id, user_id: userId, inventory_id: b5_inv1, name: "50kg Un Çuvalı", unit_type: "adet", quantity: 20, unit_price: 650, discount_rate: 0, total_amount: 13000
    });


    // -------------------------------------------------------------------------
    // 6. Serbest Meslek & Proje: "KodArt Dijital Ajans"
    // -------------------------------------------------------------------------
    const b6_id = crypto.randomUUID();
    await supabase.from("businesses").insert({
      id: b6_id, user_id: userId, name: "KodArt Dijital Ajans", sector: "serbest_meslek", business_type: "freelance", currency: "TRY", vat_enabled: true, default_vat: 20
    });

    const b6_client = crypto.randomUUID();
    await supabase.from("freelance_clients").insert({
      id: b6_client, business_id: b6_id, user_id: userId, name: "Ali Yetkili", company_name: "XYZ Teknoloji A.Ş.", phone: "5557778899"
    });

    const b6_project = crypto.randomUUID();
    await supabase.from("freelance_projects").insert({
      id: b6_project, business_id: b6_id, user_id: userId, client_id: b6_client, name: "Kurumsal Web Sitesi & Uygulama", total_budget: 120000, paid_amount: 40000, hourly_rate: 0, status: "in_progress", completion_percentage: 33
    });

    await supabase.from("project_tasks").insert([
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, title: "Tasarım", is_completed: true, sort_order: 1 },
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, title: "Backend", is_completed: false, sort_order: 2 },
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, title: "Test", is_completed: false, sort_order: 3 }
    ]);

    await supabase.from("project_milestones").insert([
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, name: "Tasarım Hakedişi", amount: 40000, is_paid: true, paid_at: new Date().toISOString() },
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, name: "Backend Hakedişi", amount: 40000, is_paid: false },
      { id: crypto.randomUUID(), project_id: b6_project, business_id: b6_id, user_id: userId, name: "Teslimat", amount: 40000, is_paid: false }
    ]);

    return { success: true };
  } catch (error) {
    console.error("Senaryo verileri oluşturulurken hata:", error);
    return { success: false, error: "Test verileri yüklenirken bir hata oluştu." };
  }
}
