import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SummaryReportCard() {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <FileBarChart className="h-5 w-5 text-accent" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-medium text-text-primary">Özet Oluştur</p>
          <p className="text-sm text-text-secondary">
            Seçtiğin dönem için detaylı finansal özet raporu oluştur.
          </p>
        </div>
      </div>
      <Link href="/reports">
        <Button variant="secondary">Oluştur</Button>
      </Link>
    </Card>
  );
}
