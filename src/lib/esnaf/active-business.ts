"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { BusinessRow } from "@/lib/types/esnaf";

const COOKIE_NAME = "fisstech-active-business";

/** Returns the user's active business, resolving from the cookie (if it's
 * still one of theirs) or falling back to their first business. "Theirs"
 * includes both owned businesses and ones they've joined as Ekip staff via
 * an accepted invite — see get_my_businesses() (docs/sql/050_my_businesses.sql),
 * needed because businesses' own RLS SELECT policy is owner-only. */
export async function getActiveBusiness(): Promise<BusinessRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const businesses = await getUserBusinesses();
  if (businesses.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(COOKIE_NAME)?.value;
  return businesses.find((b) => b.id === activeId) ?? businesses[0];
}

export async function getUserBusinesses(): Promise<BusinessRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_my_businesses");
  if (!error) {
    return ((data ?? []) as BusinessRow[]).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  // get_my_businesses() henüz docs/sql/050_my_businesses.sql SQL Editor'da
  // çalıştırılmadıysa (fonksiyon canlıda yoksa) RPC hata döner — bu durumda
  // TÜM mevcut sahiplerin işletmeleri sessizce kaybolmasın diye eski
  // (sadece sahip olunan işletmeler) sorguya geri düşülüyor. Ekip üzerinden
  // katılan personel bu fallback'te görünmez, ama sahipler hiç etkilenmez.
  const { data: owned } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return (owned ?? []) as BusinessRow[];
}

/** İşletmenin Esnaf Modu aboneliği aktif mi — sahibin `esnaf_plan`'ına göre
 * belirleniyor (personel de işverenin aboneliği üzerinden erişsin diye,
 * kendi planı değil). Bkz. docs/sql/053_paywall_enforcement.sql,
 * get_business_owner_plan(). RPC henüz production'da yoksa (migration
 * çalıştırılmadan) erişimi KİLİTLEMEK yerine izin veriyoruz — fail-open,
 * 050_my_businesses.sql'de yaşanan "SQL çalıştırılmadan herkesin erişimi
 * kayboldu" regresyonunu tekrarlamamak için. */
export async function isBusinessSubscribed(businessId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_business_owner_plan", { p_business_id: businessId });
  if (error) return true;
  const rows = (data ?? []) as { esnaf_plan: string }[];
  return rows[0]?.esnaf_plan === "esnaf_premium";
}

export async function setActiveBusinessId(businessId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, businessId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
