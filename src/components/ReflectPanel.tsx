import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reflectTurn, type ReflectTurnState } from "@/lib/amalgam/amalgam.functions";
import { downloadReportPdf } from "@/lib/pdf-export";

interface Msg {
  role: "user" | "assistant";
  content: string;
  assumption?: string | null;
  posture?: ReflectTurnState["posture"];
  phase?: ReflectTurnState["phase"];
}

export function ReflectPanel() {
  const fn = useServerFn(reflectTurn);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sessionState, setSessionState] = useState<ReflectTurnState | null>(null);
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
      const r = await fn({
        data: {
          messages: next.map(({ role, content }) => ({ role, content })),
          priorState: sessionState ?? undefined,
        },
      });
      if (!r) throw new Error("Empty response");
      const reply = (r.reply ?? "").trim() || "◌";
      setMessages([...next, {
        role: "assistant",
        content: reply,
        assumption: r.state.assumption,
        posture: r.state.posture,
        phase: r.state.phase,
      }]);
      setSessionState(r.state);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const exportPdf = () => {
    const baseSections = messages.map(m => ({
      heading: m.role === "user" ? "You" : "Mirror",
      body: m.content,
      ...(m.assumption ? { subheading: `surfaced assumption · ${m.assumption}` } : {}),
    }));
    const trailSections = sessionState ? [
      {
        heading: "Session geometry",
        subheading: "phase trail · posture trail",
        body: [
          "phases: " + messages.filter(m => m.phase).map(m => m.phase).join(" → "),
          "postures: " + messages.filter(m => m.posture).map(m => m.posture).join(" → "),
        ].join("\n"),
      },
      ...(sessionState.polesObserved.length ? [{
        heading: "Poles observed",
        body: sessionState.polesObserved.map(p => `${p.dim} · ${p.a} ↔ ${p.b} — ${p.note}`).join("\n"),
      }] : []),
      ...(sessionState.latent.length ? [{
        heading: "Latent (not yet present)",
        body: sessionState.latent.map(p => `${p.dim} — ${p.note}`).join("\n"),
      }] : []),
    ] : [];
    downloadReportPdf({
      title: "Reflect — emergent mirror",
      subtitle: `${messages.length} exchange${messages.length === 1 ? "" : "s"}`,
      filename: `reflect-session-${Date.now()}.pdf`,
      sections: [...baseSections, ...trailSections],
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-center text-sm text-muted mb-4 max-w-md mx-auto">
        Describe what is present. The mirror observes the geometry between us. It does not push you toward a missing pole. Sometimes its most coherent reply is silence.
      </p>
      {messages.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={exportPdf}
            className="text-[10px] uppercase tracking-[0.25em] px-4 py-2 border border-accent-gold/40 text-accent-gold rounded hover:bg-accent-gold/10 transition-colors"
          >
            ↓ Download PDF
          </button>
        </div>
      )}

      <div className="min-h-[400px] bg-white/[0.02] border border-border rounded-3xl p-6 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-muted/60 text-sm font-mono py-16">◌ waiting</div>
        )}
        {messages.map((m, i) => {
          const isSilence = m.role === "assistant" && (m.posture === "silence" || m.content.trim() === "◌");
          const hasAssumption = m.role === "assistant" && !!m.assumption;
          if (isSilence) {
            return (
              <div key={i} className="flex justify-center py-4">
                <div className="text-3xl font-mono text-muted/70 select-none">◌</div>
              </div>
            );
          }
          return (
            <div key={i} className={`max-w-[85%] ${m.role === "user" ? "ml-auto" : ""}`}>
              <div className={`text-[10px] uppercase tracking-[0.2em] mb-1 ${m.role === "user" ? "text-accent-cyan text-right" : "text-accent-gold"}`}>
                {m.role === "user" ? "you" : "mirror"}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-accent-cyan/10 border border-accent-cyan/20"
                    : hasAssumption
                      ? "bg-white/[0.04] border border-white/10 border-l-2 border-l-accent-gold/60"
                      : "bg-white/[0.04] border border-white/10"
                }`}
              >
                <FormattedMessage text={m.content} />
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="max-w-[85%]">
            <div className="text-[10px] uppercase tracking-[0.2em] mb-1 text-accent-gold">mirror</div>
            <div className="rounded-2xl px-4 py-3 text-sm font-mono text-muted bg-white/[0.04] border border-white/10">
              ◌ reading geometry…
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
          placeholder="What is present right now?"
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
