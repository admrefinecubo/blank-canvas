import { cn } from "@/lib/utils";

interface Props {
  role: string;
  content: string;
  createdAt?: string | null;
  title?: string;
}

export default function WhatsAppChatBubble({ role, content, createdAt, title }: Props) {
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex w-full", isAssistant ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm",
          isAssistant ? "border-primary/20 bg-primary/10" : "border-border bg-muted",
        )}
      >
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{title || (isAssistant ? "Assistente" : "Cliente")}</span>
          {createdAt ? <span>• {createdAt}</span> : null}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{content}</p>
      </div>
    </div>
  );
}