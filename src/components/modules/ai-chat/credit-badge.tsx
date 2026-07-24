import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FREE_MONTHLY_LIMIT } from "@/lib/ai-chat/credits";

export function AiChatCreditBadge({
  remaining,
  isPremium,
}: {
  remaining: number;
  isPremium: boolean;
}) {
  return (
    <Badge tone={remaining === 0 && !isPremium ? "danger" : "accent"} className="gap-1.5">
      <Sparkles className="h-3.5 w-3.5" />
      {isPremium ? "Sınırsız sohbet" : `${remaining}/${FREE_MONTHLY_LIMIT} sohbet hakkı`}
    </Badge>
  );
}
