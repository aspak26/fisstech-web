"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { BusinessRow } from "@/lib/types/esnaf";

const COOKIE_NAME = "fisstech-active-business";

/** Returns the user's active business, resolving from the cookie (if it
 * still belongs to the user) or falling back to their first business. */
export async function getActiveBusiness(): Promise<BusinessRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(COOKIE_NAME)?.value;

  if (activeId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", activeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) return data as BusinessRow;
  }

  const { data: first } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (first as BusinessRow) ?? null;
}

export async function getUserBusinesses(): Promise<BusinessRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  return (data ?? []) as BusinessRow[];
}

export async function setActiveBusinessId(businessId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, businessId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
