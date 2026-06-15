import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { deepCompare } from "@/lib/amalgam/amalgam.functions";
import { fisherRao, midpoint, normalize, toSignature, type Vec } from "@/lib/amalgam/engine";
import { SignatureChart } from "./SignatureChart";

type Poles = {
  activeSpace: string; receptiveSpace: string;
  activeTime: string;  receptiveTime: string;
  dynamicSpace: string; staticSpace: string;
  dynamicTime: string;  staticTime: string;
};

type DeepResult = {
  vA: Vec; vB: Vec;
  tensionsA: string; tensionsB: string;
  polesA: Poles; polesB: Poles;
  matrix: { spaceTension: string; timeTension: string };
  isomorphisms: {
    activeExtreme: string; receptiveExtreme: string;
    dynamicExtreme: string; staticExtreme: string;
  };
  polarityCore: string;
  analogues: Array<{ system: string; mapping: string }>;
  layers: { concrete: string; human: string; amalgam: string };
  necessity: string;
  nextStep: string;
  aClaimant: string; bClaimant: string;
};

export function IsoPanel() {
  const fn = useServerFn(deepCompare);
  const [aClaimant, setAClaimant] = useState("");
  const [aClaim, setAClaim] = useState("");
  const [bClaimant, setBClaimant] = useState("");
  const [bClaim, setBClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<DeepResult | null>(null);

  const ready = aClaimant.trim() && aClaim.trim() && bClaimant.trim() && bClaim.trim();

  const run = async () => {
    if (!ready || loading) return;
    setLoading(true); setErr(null);
    try {
      const r = await fn({ data: {
        aClaimant: aClaimant.trim(), aClaim: aClaim.trim(),
        bClaimant: bClaimant.trim(), bClaim: bClaim.trim(),
      }});
      if (!r) throw new Error("Empty response");
      setRes({ ...r, vA: normalize(r.vA), vB: normalize(r.vB), aClaimant: aClaimant.trim(), bClaimant: bClaimant.trim() });
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const dist = res ? fisherRao(res.vA, res.vB) : 0;
  const sim = res ? Math.max(0, Math.min(1, 1 - dist / (Math.PI / 2))) : 0;
  const third = res ? midpoint(res.vA, res.vB) : null;

  return (
    <div className="space-y-12">
      {/* INPUTS */}
      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <SideInput
          color="#00f5ff" label="Side A" accent="cyan"
          claimant={aClaimant} setClaimant={setAClaimant}
          claim={aClaim} setClaim={setAClaim}
          placeholderName="e.g. Maria, the engineer" placeholderClaim="State the claim. Context. The argument behind it."
        />
        <SideInput
          color="#ff00ea" label="Side B" accent="magenta"
          claimant={bClaimant} setClaimant={setBClaimant}
          claim={bClaim} setClaim={setBClaim}
          placeholderName="e.g. Jonas, the operator" placeholderClaim="State the opposing claim. Context. The argument behind it."
        />
      </div>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={run}
          disabled={loading || !ready}
          className="block mx-auto px-10 py-3 bg-accent-gold text-background font-semibold rounded-xl hover:bg-accent-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Reading the structure…" : "Read the tensions"}
        </button>
        {err && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{err}</div>
        )}
      </div>

      {res && (
        <div className="space-y-10 animate-[fade-up_0.5s_var(--ease-out-expo)]">
          {/* SIGNATURES + THIRD */}
          <div className="grid lg:grid-cols-3 gap-6">
            <PoleCard label={res.aClaimant} sig={toSignature(res.vA)} vec={res.vA} color="#00f5ff" tensions={res.tensionsA} />
            <div className="bg-gradient-to-b from-accent-gold/10 via-white/[0.04] to-accent-gold/10 border border-accent-gold/30 rounded-3xl p-6 flex flex-col items-center text-center">
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-2">The third</div>
              <div className="font-display font-black text-5xl mb-1">1<span className="text-accent-cyan">+</span>1<span className="text-accent-magenta">=</span><span className="text-accent-gold">3</span></div>
              <div className="font-mono text-[10px] text-muted mb-4">τ = {dist.toFixed(3)} rad · {Math.round(sim * 100)}% resonance</div>
              {third && <SignatureChart vec={third} size={220} color="#ffcf7d" />}
              <p className="font-serif italic text-lg text-foreground/90 leading-snug mt-4">"{res.polarityCore}"</p>
            </div>
            <PoleCard label={res.bClaimant} sig={toSignature(res.vB)} vec={res.vB} color="#ff00ea" tensions={res.tensionsB} />
          </div>

          {/* POLES MATRICES (active/receptive · static/dynamic × space/time) */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PoleMatrix title={res.aClaimant} color="#00f5ff" poles={res.polesA} />
            <PoleMatrix title={res.bClaimant} color="#ff00ea" poles={res.polesB} />
          </div>

          {/* SPACE/TIME TENSION MATRIX */}
          <Section title="Matrix of polar tensions" subtitle="A ↔ B viewed from space and from time">
            <div className="grid md:grid-cols-2 gap-4">
              <MatrixCell label="From SPACE" body={res.matrix.spaceTension} accent="text-accent-cyan" />
              <MatrixCell label="From TIME" body={res.matrix.timeTension} accent="text-accent-magenta" />
            </div>
          </Section>

          {/* ISOMORPHISMS — four extremes */}
          <Section title="Isomorphisms across extremes" subtitle="Both sides read from a single polar extreme at a time">
            <div className="grid md:grid-cols-2 gap-4">
              <IsoCell label="Pure active" body={res.isomorphisms.activeExtreme} />
              <IsoCell label="Pure receptive" body={res.isomorphisms.receptiveExtreme} />
              <IsoCell label="Pure dynamic" body={res.isomorphisms.dynamicExtreme} />
              <IsoCell label="Pure static" body={res.isomorphisms.staticExtreme} />
            </div>
          </Section>

          {/* ANALOGUES — same polarity in other systems */}
          <Section title="Same polarity, other systems" subtitle="Isomorphic structures elsewhere">
            <div className="grid md:grid-cols-3 gap-4">
              {res.analogues.map((a, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-accent-gold mb-2">{a.system}</div>
                  <p className="text-sm text-foreground/85 leading-relaxed">{a.mapping}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* THREE LAYERS */}
          <Section title="Three layers" subtitle="Concrete · Human · Amalgam">
            <div className="grid md:grid-cols-3 gap-4">
              <LayerCard label="Concrete" sub="the actual situation" body={res.layers.concrete} ring="border-accent-cyan/30" />
              <LayerCard label="Human" sub="emotion & subjectivity" body={res.layers.human} ring="border-accent-magenta/30" />
              <LayerCard label="Amalgam" sub="holographic tension map" body={res.layers.amalgam} ring="border-accent-gold/40" />
            </div>
          </Section>

          {/* NECESSITY + NEXT STEP */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">Necessity report</div>
              <p className="text-base text-foreground/90 leading-relaxed">{res.necessity}</p>
            </div>
            <div className="bg-gradient-to-br from-accent-gold/15 to-transparent border border-accent-gold/40 rounded-3xl p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-3">Minimum coherent next step</div>
              <p className="font-serif italic text-xl text-foreground leading-snug">{res.nextStep}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SideInput({
  label, color, accent, claimant, setClaimant, claim, setClaim, placeholderName, placeholderClaim,
}: {
  label: string; color: string; accent: "cyan" | "magenta";
  claimant: string; setClaimant: (v: string) => void;
  claim: string; setClaim: (v: string) => void;
  placeholderName: string; placeholderClaim: string;
}) {
  const ring = accent === "cyan" ? "border-accent-cyan/30 focus:border-accent-cyan/70" : "border-accent-magenta/30 focus:border-accent-magenta/70";
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color }}>{label}</span>
      </div>
      <input
        value={claimant}
        onChange={(e) => setClaimant(e.target.value)}
        placeholder={placeholderName}
        className={`w-full bg-white/5 border ${ring} rounded-xl px-4 py-3 text-sm font-medium focus:outline-none placeholder:text-white/20`}
      />
      <textarea
        value={claim}
        onChange={(e) => setClaim(e.target.value)}
        placeholder={placeholderClaim}
        rows={6}
        className={`w-full bg-white/5 border ${ring} rounded-xl px-4 py-3 text-sm font-light focus:outline-none placeholder:text-white/20 leading-relaxed resize-y`}
      />
    </div>
  );
}

function PoleCard({ label, sig, vec, color, tensions }: { label: string; sig: string; vec: Vec; color: string; tensions: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex flex-col items-center">
      <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color }}>Side</div>
      <div className="font-serif italic text-2xl mb-1 text-center">{label}</div>
      <div className="font-mono text-[10px] text-muted mb-4">{sig}</div>
      <SignatureChart vec={vec} size={220} color={color} />
      <p className="text-xs text-foreground/70 mt-4 leading-relaxed text-center">{tensions}</p>
    </div>
  );
}

function PoleMatrix({ title, color, poles }: { title: string; color: string; poles: Poles }) {
  const Cell = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted mb-1">{label}</div>
      <div className="text-xs leading-snug text-foreground/85">{value}</div>
    </div>
  );
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="font-serif italic text-lg">{title}</span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.25em] text-muted">poles</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent-cyan">— space —</div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent-magenta">— time —</div>
        <Cell label="active · space" value={poles.activeSpace} />
        <Cell label="active · time" value={poles.activeTime} />
        <Cell label="receptive · space" value={poles.receptiveSpace} />
        <Cell label="receptive · time" value={poles.receptiveTime} />
        <Cell label="dynamic · space" value={poles.dynamicSpace} />
        <Cell label="dynamic · time" value={poles.dynamicTime} />
        <Cell label="static · space" value={poles.staticSpace} />
        <Cell label="static · time" value={poles.staticTime} />
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <div className="font-display text-2xl">{title}</div>
        {subtitle && <div className="text-xs text-muted font-mono uppercase tracking-[0.2em] mt-1">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function MatrixCell({ label, body, accent }: { label: string; body: string; accent: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className={`text-[10px] uppercase tracking-[0.3em] mb-2 ${accent}`}>{label}</div>
      <p className="text-sm text-foreground/85 leading-relaxed">{body}</p>
    </div>
  );
}

function IsoCell({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-2">{label}</div>
      <p className="text-sm text-foreground/85 leading-relaxed">{body}</p>
    </div>
  );
}

function LayerCard({ label, sub, body, ring }: { label: string; sub: string; body: string; ring: string }) {
  return (
    <div className={`bg-white/[0.03] border ${ring} rounded-2xl p-5`}>
      <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/80 mb-1">{label}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3 font-mono">{sub}</div>
      <p className="text-sm text-foreground/85 leading-relaxed">{body}</p>
    </div>
  );
}
