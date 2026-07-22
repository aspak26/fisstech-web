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
  const { data } = await supabase.rpc("get_my_businesses");
  return ((data ?? []) as BusinessRow[]).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function setActiveBusinessId(businessId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, businessId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
