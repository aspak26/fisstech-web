"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { currentMonthString, getMonthRange } from "@/lib/utils/date";

export function ReportPeriodSelector() {
  const router = useRouter();
  const [type, setType] = useState<"daily" | "monthly">("monthly");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function generate() {
    let start: string;
    let end: string;
    if (type === "daily") {
      start = date;
      end = date;
    } else {
      const month = date.slice(0, 7);
      ({ start, end } = getMonthRange(month || currentMonthString()));
    }
    router.push(`/reports?start=${start}&end=${end}`);
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <div className="mb-4 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <BarChart3 className="h-6 w-6 text-accent" />
        </div>
      </div>
      <p className="mb-5 font-medium text-text-primary">
        Hangi dönemin özetini oluşturmak istiyorsunuz?
      </p>
      <div className="mb-5 flex justify-center">
        <Tabs
          value={type}
          onChange={(v) => setType(v as "daily" | "monthly")}
          options={[
            { value: "daily", label: "Günlük" },
            { value: "monthly", label: "Aylık" },
          ]}
        />
      </div>
      <div className="mb-6 text-left">
        <Label htmlFor="report-date">{type === "daily" ? "Tarih" : "Ay"}</Label>
        <Input
          id="report-date"
          type={type === "daily" ? "date" : "month"}
          value={type === "daily" ? date : date.slice(0, 7)}
          onChange={(e) => setDate(type === "daily" ? e.target.value : `${e.target.value}-01`)}
        />
      </div>
      <Button onClick={generate} className="w-full">
        Özet Oluştur
      </Button>
    </Card>
  );
}
