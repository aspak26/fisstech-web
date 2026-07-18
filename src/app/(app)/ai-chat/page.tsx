import { formatMonthLabel, currentMonthString } from "@/lib/utils/date";
import { ChatWorkspace } from "@/components/modules/ai-chat/chat-workspace";

export default function AiChatPage() {
  const periodLabel = formatMonthLabel(currentMonthString());

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <h1 className="mb-4 font-display text-2xl font-semibold text-text-primary">AI Sohbet</h1>
      <ChatWorkspace periodLabel={periodLabel} />
    </div>
  );
}
