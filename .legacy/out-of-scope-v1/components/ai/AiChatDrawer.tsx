import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { invokeEdge } from "@/lib/edge-fn";
import { toast } from "sonner";
import { mapSupabaseError } from "@/lib/errors";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STARTERS = [
  "Quais produtos estão com estoque crítico?",
  "Mostra os 5 produtos mais vendidos no mês",
  "Tem algum lote vencendo nos próximos 15 dias?",
  "Qual o valor total do meu estoque?",
];

export function AiChatDrawer({ open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const history = [...messages, { role: "user" as const, content: text }];
      setMessages(history);
      setInput("");
      const res = await invokeEdge<{ reply: string; tools_used: number }>("ai-chat", {
        messages: history,
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
      return res;
    },
    onError: (e) => {
      toast.error(mapSupabaseError(e));
      setMessages((m) => m.slice(0, -1));
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, send.isPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    send.mutate(text);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-primary" />
            Assistente IA
          </SheetTitle>
          <SheetDescription>
            Pergunte sobre estoque, vendas, lotes, compras. A IA consulta seus dados em tempo real.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <Bot className="h-12 w-12 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Pergunte algo sobre seu estoque. Exemplos:
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {STARTERS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
                    onClick={() => send.mutate(s)}
                    disabled={send.isPending}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <Message key={i} role={m.role} content={m.content} />
              ))}
              {send.isPending && (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consultando...
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border bg-bg-base/40 px-5 py-3">
          <div className="flex gap-2">
            <Textarea
              placeholder="Pergunte algo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              className="resize-none"
              disabled={send.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || send.isPending}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-muted" : "bg-accent-primary/15 text-accent-primary"
        }`}
      >
        {isUser ? <User className="h-3 w-3" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-accent-primary text-white" : "bg-card border border-border"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  );
}
