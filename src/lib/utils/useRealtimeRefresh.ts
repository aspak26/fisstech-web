"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Subscribes to Postgres Changes on the given tables and calls
 * `router.refresh()` (debounced) whenever any of them change — RLS still
 * applies to Realtime, so this only ever fires for rows the signed-in user
 * can already SELECT. Requires the tables to be added to the
 * `supabase_realtime` publication (see docs/sql/047_web_realtime.sql) —
 * without that, the subscription is a harmless no-op, never a fake signal. */
export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = tables.join(",");

  useEffect(() => {
    if (!key) return;
    const supabase = createClient();
    const channel = supabase.channel(`web-refresh:${key}`);

    for (const table of key.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => router.refresh(), 400);
      });
    }
    channel.subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
