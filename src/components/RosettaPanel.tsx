import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeConcept } from "@/lib/amalgam/amalgam.functions";
import { DIMS, DOMAINS, normalize, toSignature, translate, makeSentence, hashString, domainName, dimDesc, type Vec } from "@/lib/amalgam/engine";
import { SignatureChart } from "./SignatureChart";
import { downloadReportPdf, dimReadout } from "@/lib/pdf-export";
import { useLang, langName } from "@/lib/i18n";

const EXAMPLES_EN = ["Entropy", "Silence", "Revolution", "Love", "Forgiveness", "Memory", "Order", "Chaos"];
const EXAMPLES_ES = ["Entropía", "Silencio", "Revolución", "Amor", "Perdón", "Memoria", "Orden", "Caos"];
const PILL_COLORS = ["bg-accent-cyan text-black", "bg-accent-magenta text-black", "bg-accent-gold text-black"];

type Polarity = { a: string; b: string; dim: string; note: string };
type ConceptResult = {
  vec: Vec;
  tensionMap: Record<string, string>;
  explanation: string;
  polarities: Polarity[];
  concept: string;
  domain: string;
};

export function RosettaPanel() {
  const fn = useServerFn(analyzeConcept);
  const { lang, t } = useLang();
  const EXAMPLES = lang === "es" ? EXAMPLES_ES : EXAMPLES_EN;
  const [concept, setConcept] = useState("");
  const [domain, setDomain] = useState("philosophy");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<ConceptResult | null>(null);

  const run = async (term?: string) => {
    const c = (term ?? concept).trim();
    if (!c || loading) return;
    setConcept(c); setLoading(true); setErr(null);
    try {
      const r = await fn({ data: { concept: c, domain: DOMAINS[domain].name, lang: langName(lang) } });
      if (!r) throw new Error("Empty response");
      setResult({
        vec: normalize(r.vec),
        tensionMap: r.tensionMap,
        explanation: r.explanation,
        polarities: r.polarities,
        concept: c,
        domain,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Something went wrong.", "Algo salió mal."));
    } finally { setLoading(false); }
  };

  const sig = result ? toSignature(result.vec) : null;
  const seed = result ? hashString(result.concept) : 0;
  const translations = result
    ? Object.entries(DOMAINS)
        .filter(([k]) => k !== result.domain)
        .map(([k, d], i) => {
          const items = translate(result.vec, k);
          const dName = domainName(k, d.name, lang);
          return {
            key: k,
            domain: { ...d, name: dName },
            sentence: makeSentence(items, dName, result.concept, seed + i, lang),
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
            placeholder={t("Enter a concept — silence, entropy, love…", "Escribe un concepto — silencio, entropía, amor…")}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-32 py-5 text-lg font-light focus:outline-none focus:border-accent-cyan/60 placeholder:text-white/20 transition-colors"
          />
          <button
            onClick={() => run()}
            disabled={loading || !concept.trim()}
            className="absolute right-3 top-3 bottom-3 px-6 bg-foreground text-background font-semibold rounded-xl hover:bg-accent-gold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "…" : t("Analyze", "Analizar")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted">{t("Source domain", "Dominio de origen")}</span>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="bg-white/5 border border-white/10 rounded text-xs font-mono px-2 py-1 text-foreground focus:outline-none focus:border-accent-gold/60"
          >
            {Object.entries(DOMAINS).map(([k, d]) => (
              <option key={k} value={k} className="bg-background">{d.icon} {domainName(k, d.name, lang)}</option>
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
        <div className="max-w-3xl mx-auto -mt-4 flex justify-end">
          <button
            onClick={() => downloadReportPdf({
              title: `${t("Concept", "Concepto")}: ${result.concept}`,
              subtitle: `${t("Source domain", "Dominio de origen")}: ${domainName(result.domain, DOMAINS[result.domain].name, lang)}   ·   Σ ${t("signature", "firma")} ${sig}`,
              filename: `rosetta-${result.concept.toLowerCase().replace(/\s+/g, "-")}.pdf`,
              crystal: { vec: result.vec, signature: sig ?? "", label: result.concept },
              sections: [
                { heading: t("Explanation through the tension map", "Explicación a través del mapa de tensión"), body: result.explanation },
                {
                  heading: t("Polarities detected", "Polaridades detectadas"),
                  body: result.polarities.map(p => `${p.a}  ↔  ${p.b}   (${p.dim})\n${p.note}`).join("\n\n"),
                },
                { heading: t("11D readout", "Lectura 11D"), subheading: t("Each dimension's intensity in the crystal", "Intensidad de cada dimensión en el cristal"), body: dimReadout(result.vec) },
                {
                  heading: t("Meaning of each dimension here", "Significado de cada dimensión aquí"),
                  body: DIMS.map(d => `${d}  ${dimDesc(d, lang)}\n${result.tensionMap[d] ?? ""}`).join("\n\n"),
                },
                { heading: t("Isomorphisms across categories", "Isomorfismos entre categorías"), subheading: t("Same structure, other domains", "Misma estructura, otros dominios") },
                ...translations.map(tr => ({
                  heading: `${tr.domain.icon} ${tr.domain.name}`,
                  subheading: tr.items.map(it => `${it.dim} ${Math.round(it.intensity*100)}%`).join("   ·   "),
                  body: tr.sentence,
                })),
              ],
            })}
            className="text-[10px] uppercase tracking-[0.25em] px-4 py-2 border border-accent-gold/40 text-accent-gold rounded hover:bg-accent-gold/10 transition-colors"
          >
            ↓ {t("Download PDF", "Descargar PDF")}
          </button>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-[fade-up_0.5s_var(--ease-out-expo)]">
          {/* LEFT: crystal + signature */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start space-y-6">
            <div className="aspect-square relative flex items-center justify-center bg-white/[0.02] rounded-3xl border border-border p-6 overflow-hidden">
              <SignatureChart vec={result.vec} />
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest text-muted">
                {t("Σ crystal of tension", "Σ cristal de tensión")}
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center font-serif italic text-2xl text-accent-gold">
                {sig}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-widest text-muted mb-2">{t("11D readout", "Lectura 11D")}</h3>
              {DIMS.map((d) => (
                <div key={d} className="flex items-center gap-3 py-1.5 border-b border-border">
                  <span className="font-mono text-xs w-8 text-foreground">{d}</span>
                  <span className="font-mono text-[10px] text-muted flex-shrink-0 w-28">{dimDesc(d, lang)}</span>
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

          {/* RIGHT: explanation + polarities + dimension meanings + isomorphisms */}
          <div className="lg:col-span-7 space-y-8">
            {/* EXPLANATION */}
            <div className="bg-gradient-to-br from-accent-gold/10 via-white/[0.03] to-transparent border border-accent-gold/30 rounded-3xl p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-accent-gold mb-3">{t("Explanation through the tension map", "Explicación a través del mapa de tensión")}</div>
              <p className="font-serif italic text-xl text-foreground/95 leading-snug">{result.explanation}</p>
            </div>

            {/* POLARITIES */}
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">{t("Polarities detected in this concept", "Polaridades detectadas en este concepto")}</div>
              <div className="space-y-2">
                {result.polarities.map((p, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="bg-accent-cyan/15 text-accent-cyan px-3 py-0.5 rounded-full text-xs font-medium">{p.a}</span>
                      <span className="text-muted text-xs">↔</span>
                      <span className="bg-accent-magenta/15 text-accent-magenta px-3 py-0.5 rounded-full text-xs font-medium">{p.b}</span>
                      <span className="ml-auto font-mono text-[10px] text-accent-gold">{p.dim}</span>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{p.note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DIMENSION MEANINGS */}
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-3">{t("Meaning of each dimension here", "Significado de cada dimensión aquí")}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {DIMS.map((d) => (
                  <div key={d} className="bg-white/[0.02] border border-white/10 rounded-xl p-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="font-mono text-sm text-accent-gold">{d}</span>
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">{dimDesc(d, lang)}</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-snug">{result.tensionMap[d]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ISOMORPHISMS */}
            <div>
              <h2 className="text-[10px] uppercase tracking-widest text-muted mb-3 flex items-baseline justify-between">
                <span>{t("Isomorphisms across categories", "Isomorfismos entre categorías")}</span>
                <span className="font-mono text-accent-gold/60">{translations.length}/{Object.keys(DOMAINS).length - 1}</span>
              </h2>
              <div className="space-y-3">
                {translations.map((tr, i) => (
                  <div
                    key={tr.key}
                    className="group p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.05] hover:border-accent-gold/30 transition-all"
                    style={{ animation: `fade-up 0.4s ${i * 50}ms var(--ease-out-expo) both` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className={`text-[10px] font-bold tracking-tighter px-2 py-0.5 rounded ${PILL_COLORS[i % PILL_COLORS.length]}`}>
                        {tr.domain.icon} {tr.domain.name.toUpperCase()}
                      </div>
                      <div className="text-[10px] font-mono text-muted">{String(i + 1).padStart(2, "0")}/{translations.length}</div>
                    </div>
                    <p className="text-base font-medium text-foreground/90 leading-snug mb-3">{tr.sentence}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.items.map((it) => (
                        <span key={it.dim} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-white/10 rounded text-muted">
                          {it.dim} · {Math.round(it.intensity * 100)}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function descOf(d: string) {
  return ({ 'Ξ':'pause','T':'tension','R':'relation','E':'expansion','M':'memory','V':'void','S':'system','A':'action','F':'focus','φe':'fractal exp','φc':'fractal contract' } as Record<string,string>)[d] || "";
}
