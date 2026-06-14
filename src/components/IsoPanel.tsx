import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { compareConcepts } from "@/lib/amalgam/amalgam.functions";
import { fisherRao, midpoint, normalize, toSignature, type Vec } from "@/lib/amalgam/engine";
import { SignatureChart } from "./SignatureChart";

export function IsoPanel() {
  const fn = useServerFn(compareConcepts);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<{ vA: Vec; vB: Vec; insight: string; a: string; b: string } | null>(null);

  const run = async () => {
    if (!a.trim() || !b.trim() || loading) return;
    setLoading(true); setErr(null);
    try {
      const r = await fn({ data: { a: a.trim(), b: b.trim() } });
      if (!r) throw new Error("Empty response");
      setRes({ vA: normalize(r.vA), vB: normalize(r.vB), insight: r.insight, a: a.trim(), b: b.trim() });
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const dist = res ? fisherRao(res.vA, res.vB) : 0;
  const sim = res ? Math.max(0, Math.min(1, 1 - dist / (Math.PI / 2))) : 0;
  const third = res ? midpoint(res.vA, res.vB) : null;

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end max-w-5xl mx-auto">
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-accent-cyan block mb-2">Pole A</label>
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Order"
            className="w-full bg-white/5 border border-accent-cyan/30 rounded-2xl px-5 py-4 text-lg font-light focus:outline-none focus:border-accent-cyan/70 placeholder:text-white/20"
          />
        </div>
        <div className="text-center font-serif italic text-3xl text-accent-gold pb-3">+</div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.25em] text-accent-magenta block mb-2">Pole B</label>
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="Chaos"
            className="w-full bg-white/5 border border-accent-magenta/30 rounded-2xl px-5 py-4 text-lg font-light focus:outline-none focus:border-accent-magenta/70 placeholder:text-white/20"
          />
        </div>
      </div>
      <div className="max-w-5xl mx-auto">
        <button
          onClick={run}
          disabled={loading || !a.trim() || !b.trim()}
          className="block mx-auto px-10 py-3 bg-accent-gold text-background font-semibold rounded-xl hover:bg-accent-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Synthesizing…" : "Find the third"}
        </button>
        {err && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>
        )}
      </div>

      {res && (
        <div className="grid lg:grid-cols-3 gap-6 animate-[fade-up_0.5s_var(--ease-out-expo)]">
          <PoleCard label={res.a} sig={toSignature(res.vA)} vec={res.vA} color="#00f5ff" />
          <div className="bg-gradient-to-b from-accent-gold/10 via-white/[0.04] to-accent-gold/10 border border-accent-gold/30 rounded-3xl p-6 flex flex-col items-center text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-2">The third</div>
            <div className="font-display font-black text-5xl mb-1">1<span className="text-accent-cyan">+</span>1<span className="text-accent-magenta">=</span><span className="text-accent-gold">3</span></div>
            <div className="font-mono text-[10px] text-muted mb-4">τ = {dist.toFixed(3)} rad · {Math.round(sim * 100)}% resonance</div>
            {third && <SignatureChart vec={third} size={220} color="#ffcf7d" />}
            <p className="font-serif italic text-lg text-foreground/90 leading-snug mt-4">"{res.insight}"</p>
          </div>
          <PoleCard label={res.b} sig={toSignature(res.vB)} vec={res.vB} color="#ff00ea" />
        </div>
      )}
    </div>
  );
}

function PoleCard({ label, sig, vec, color }: { label: string; sig: string; vec: Vec; color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color }}>Pole</div>
      <div className="font-serif italic text-2xl mb-1">{label}</div>
      <div className="font-mono text-[10px] text-muted mb-4">{sig}</div>
      <SignatureChart vec={vec} size={220} color={color} />
    </div>
  );
}
