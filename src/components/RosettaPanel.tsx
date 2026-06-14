import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeConcept } from "@/lib/amalgam/amalgam.functions";
import { DIMS, DOMAINS, normalize, toSignature, translate, makeSentence, hashString, type Vec } from "@/lib/amalgam/engine";
import { SignatureChart } from "./SignatureChart";

const EXAMPLES = ["Entropy", "Silence", "Revolution", "Love", "Forgiveness", "Memory", "Order", "Chaos"];
const PILL_COLORS = ["bg-accent-cyan text-black", "bg-accent-magenta text-black", "bg-accent-gold text-black"];

export function RosettaPanel() {
  const fn = useServerFn(analyzeConcept);
  const [concept, setConcept] = useState("");
  const [domain, setDomain] = useState("philosophy");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ vec: Vec; concept: string; domain: string } | null>(null);

  const run = async (term?: string) => {
    const c = (term ?? concept).trim();
    if (!c || loading) return;
    setConcept(c); setLoading(true); setErr(null);
    try {
      const r = await fn({ data: { concept: c, domain: DOMAINS[domain].name } });
      if (!r) throw new Error("Empty response");
      setResult({ vec: normalize(r.vec), concept: c, domain });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  };

  const sig = result ? toSignature(result.vec) : null;
  const seed = result ? hashString(result.concept) : 0;
  const translations = result
    ? Object.entries(DOMAINS)
        .filter(([k]) => k !== result.domain)
        .map(([k, d], i) => {
          const items = translate(result.vec, k);
          return {
            key: k,
            domain: d,
            sentence: makeSentence(items, d.name, result.concept, seed + i),
            items,
          };
        })
    : [];

  return (
    <div className="space-y-12">
      {/* INPUT */}
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="relative">
          <input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") run(); }}
            placeholder="Enter a concept — silence, entropy, love…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-32 py-5 text-lg font-light focus:outline-none focus:border-accent-cyan/60 placeholder:text-white/20 transition-colors"
          />
          <button
            onClick={() => run()}
            disabled={loading || !concept.trim()}
            className="absolute right-3 top-3 bottom-3 px-6 bg-foreground text-background font-semibold rounded-xl hover:bg-accent-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "…" : "Analyze"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Source domain</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="bg-white/5 border border-white/10 rounded text-xs font-mono px-2 py-1 text-foreground focus:outline-none focus:border-accent-gold/60"
          >
            {Object.entries(DOMAINS).map(([k, d]) => (
              <option key={k} value={k} className="bg-background">{d.icon} {d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => run(ex)}
              disabled={loading}
              className="text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border border-border rounded hover:bg-white/5 hover:border-accent-gold/40 disabled:opacity-40 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {err && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {err}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-[fade-up_0.5s_var(--ease-out-expo)]">
          {/* LEFT: chart + signature */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start space-y-6">
            <div className="aspect-square relative flex items-center justify-center bg-white/[0.02] rounded-3xl border border-border p-6 overflow-hidden">
              <SignatureChart vec={result.vec} />
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-muted">
                Σ signature
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center font-serif italic text-2xl text-accent-gold">
                {sig}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-widest text-muted mb-2">11D readout</h3>
              {DIMS.map((d) => (
                <div key={d} className="flex items-center gap-3 py-1.5 border-b border-border">
                  <span className="font-mono text-xs w-8 text-foreground">{d}</span>
                  <span className="font-mono text-[10px] text-muted flex-shrink-0 w-28">{descOf(d)}</span>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-cyan via-accent-gold to-accent-magenta"
                      style={{ width: `${result.vec[d] * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted w-8 text-right">{result.vec[d].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: translations */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[10px] uppercase tracking-widest text-muted mb-2 flex items-baseline justify-between">
              <span>Cross-domain translations</span>
              <span className="font-mono text-accent-gold/60">{translations.length}/8</span>
            </h2>
            {translations.map((t, i) => (
              <div
                key={t.key}
                className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.05] hover:border-accent-gold/30 transition-all"
                style={{ animation: `fade-up 0.4s ${i * 60}ms var(--ease-out-expo) both` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`text-[10px] font-bold tracking-tighter px-2 py-0.5 rounded ${PILL_COLORS[i % PILL_COLORS.length]}`}>
                    {t.domain.icon} {t.domain.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] font-mono text-muted">{String(i + 1).padStart(2, "0")}/{translations.length}</div>
                </div>
                <p className="text-lg font-medium text-foreground/90 leading-snug mb-4">{t.sentence}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.items.map((it) => (
                    <span key={it.dim} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-white/10 rounded text-muted">
                      {it.dim} · {Math.round(it.intensity * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function descOf(d: string) {
  return ({ 'Ξ':'pause','T':'tension','R':'relation','E':'expansion','M':'memory','V':'void','S':'system','A':'action','F':'focus','φe':'fractal exp','φc':'fractal contract' } as Record<string,string>)[d] || "";
}
