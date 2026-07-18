import { Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CreditBadge({
  remaining,
  isPremium,
}: {
  remaining: number;
  isPremium: boolean;
}) {
  return (
    <Badge tone={remaining === 0 && !isPremium ? "danger" : "accent"} className="gap-1.5">
      <Ticket className="h-3.5 w-3.5" />
      {isPremium ? "Sınırsız tarama" : `${remaining}/20 fiş hakkı`}
    </Badge>
  );
}
