"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import type { GroupRow } from "@/lib/data/groups";

export function GroupSelector({ groups, groupId }: { groups: GroupRow[]; groupId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(value: string) {
    const params = new URLSearchParams(searchParams);
    params.set("groupId", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={groupId} onChange={(e) => go(e.target.value)} className="max-w-xs">
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </Select>
  );
}
