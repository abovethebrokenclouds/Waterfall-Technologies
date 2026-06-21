/**
 * AiAssistantPanel — the global, context-aware AI assistant available on every
 * screen via the floating button. It routes natural-language requests to the
 * right skill (see ai/assistant.ts) using the current brand + selected product,
 * and can answer status questions straight from app data.
 *
 * It is intentionally simple: a message list + input + quick-prompt chips. To
 * make it stream or call a real model, only ai/engine.ts needs to change.
 */
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { askAssistant, isModelConfigured } from "@/ai";
import { useStore, useSkillContext } from "@/store/AppStore";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "Give me a status overview",
  "Generate a launch campaign",
  "Write LinkedIn + X posts about onboarding",
  "Draft a nurture email sequence",
  "SEO plan for resume writing",
];

export function AiAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ctx = useSkillContext();
  const { data, selectedProduct } = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Hi! I'm your marketing copilot. Ask me to plan campaigns, write posts, draft emails, or build an SEO outline. Pick a product up top to tailor everything to it.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setBusy(true);
    try {
      const reply = await askAssistant(message, ctx, data);
      setMessages((m) => [...m, { role: "assistant", text: reply.text }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry — something went wrong. Try rephrasing." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 h-12 rounded-full shadow-lg glow-border"
        >
          <Sparkles className="h-5 w-5" />
          <span className="ml-2 font-medium">AI Copilot</span>
        </Button>
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-border bg-card shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Marketing Copilot</div>
                <div className="text-[11px] text-muted-foreground">
                  {selectedProduct ? `Focused on ${selectedProduct.name}` : "Brand-level"} ·{" "}
                  {isModelConfigured() ? "Live model" : "Local engine"}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-3 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => send(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your marketing copilot…"
                disabled={busy}
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
