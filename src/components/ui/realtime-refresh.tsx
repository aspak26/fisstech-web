"use client";

import { useRealtimeRefresh } from "@/lib/utils/useRealtimeRefresh";

/** Renders nothing — just keeps a Realtime subscription alive for the given
 * tables so Server Component pages under this layout refetch live when the
 * underlying data changes (e.g. edited from another tab, or from mobile). */
export function RealtimeRefresh({ tables }: { tables: string[] }) {
  useRealtimeRefresh(tables);
  return null;
}
