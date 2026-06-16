import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reflect } from "@/lib/amalgam/amalgam.functions";
import { downloadReportPdf } from "@/lib/pdf-export";

interface Msg { role: "user" | "assistant"; content: string; }

export function ReflectPanel() {
  const fn = useServerFn(reflect);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next); setInput(""); setLoading(true); setErr(null);
    try {
      const r = await fn({ data: { messages: next } });
      if (!r) throw new Error("Empty response");
      setMessages([...next, { role: "assistant", content: r.text }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-center text-sm text-muted mb-8 max-w-md mx-auto">
        Describe a situation, a tension, a state. The interpreter reads its structure and responds from the geometry — not from advice.
      </p>

      <div className="min-h-[400px] bg-white/[0.02] border border-border rounded-3xl p-6 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-muted/60 text-sm font-mono py-16">◈ waiting for input</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
            <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${m.role === "user" ? "text-accent-cyan text-right" : "text-accent-gold"}`}>
              {m.role === "user" ? "you" : "interpreter"}
            </div>
            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-accent-cyan/10 border border-accent-cyan/20" : "bg-white/[0.04] border border-white/10"}`}>
              <FormattedMessage text={m.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%]">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-1 text-accent-gold">interpreter</div>
            <div className="rounded-2xl px-4 py-3 text-sm font-mono text-muted bg-white/[0.04] border border-white/10">
              ◌ reading structure…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>
      )}

      <div className="relative">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="What's the situation?"
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-20 py-4 text-sm focus:outline-none focus:border-accent-gold/60 placeholder:text-white/20 resize-none"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="absolute right-3 top-3 bottom-3 px-5 bg-accent-gold text-background font-semibold rounded-xl hover:bg-accent-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  );
}

// Highlight Σ signatures (chars with braces or single dim glyphs)
function FormattedMessage({ text }: { text: string }) {
  const parts = text.split(/(\b[A-Zφc]+\s*\{[^}]*\})/g);
  return (
    <>
      {parts.map((p, i) =>
        /\{[^}]*\}/.test(p)
          ? <span key={i} className="font-mono text-accent-gold">{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}
