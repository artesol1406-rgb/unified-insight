import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IntroAnimation } from "@/components/IntroAnimation";
import { RosettaPanel } from "@/components/RosettaPanel";
import { IsoPanel } from "@/components/IsoPanel";
import { ReflectPanel } from "@/components/ReflectPanel";
import { useLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "1+1=3 — The Universal Interpreter" },
      { name: "description", content: "Where two poles become a third. Map any concept into 11-dimensional polarity space and translate it across physics, music, psychology, narrative, biology, math, philosophy, ecology." },
      { property: "og:title", content: "1+1=3 — The Universal Interpreter" },
      { property: "og:description", content: "Two poles in tension produce a third, emergent thing." },
    ],
  }),
  component: Page,
});

type Mode = "rosetta" | "iso" | "reflect";

function Page() {
  const [introDone, setIntroDone] = useState(false);
  const [mode, setMode] = useState<Mode>("rosetta");
  const { t } = useLang();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("intro-seen") === "1") setIntroDone(true);
  }, []);

  const finishIntro = () => {
    sessionStorage.setItem("intro-seen", "1");
    setIntroDone(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      {!introDone && <IntroAnimation onDone={finishIntro} />}

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex justify-between items-center border-b border-border bg-background/80 backdrop-blur-md">
        <div className="font-display font-extrabold text-xl tracking-tighter">
          1<span className="text-accent-cyan">+</span>1<span className="font-serif italic font-normal text-accent-magenta">=</span><span className="text-accent-gold">3</span>
        </div>
        <ModeSwitcher mode={mode} setMode={setMode} />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <div className="hidden sm:block font-mono text-[10px] uppercase tracking-widest text-accent-gold/60">
            Σ · v1.0
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="relative size-[600px] border border-accent-cyan/20 rounded-full animate-[spin-slow_60s_linear_infinite]">
            <div className="absolute inset-0 border border-accent-magenta/20 rounded-full rotate-45 scale-90" />
            <div className="absolute inset-0 border border-accent-gold/20 rounded-full -rotate-45 scale-75" />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--color-background)_70%)]" />
        </div>

        <div className="relative z-10 space-y-6 max-w-3xl animate-[intro-assemble_1s_var(--ease-out-expo)_both]">
          <div className="inline-block px-3 py-1 border border-accent-gold/30 rounded-full text-[10px] uppercase tracking-[0.3em] text-accent-gold">
            {t("The end of duality", "El fin de la dualidad")}
          </div>
          <h1 className="text-7xl md:text-9xl font-display font-black tracking-tighter text-balance">
            1+1<span className="italic font-serif font-normal text-accent-gold">=</span>3
          </h1>
          <p className="text-muted max-w-xl mx-auto text-base md:text-lg leading-relaxed text-pretty">
            {t(
              "The universal interpreter. Map any concept into 11-dimensional polarity space — then watch two poles become a third, emergent thing.",
              "El intérprete universal. Proyecta cualquier concepto en un espacio de polaridad de 11 dimensiones — y observa cómo dos polos se convierten en un tercero emergente."
            )}
          </p>
        </div>

        <div className="relative z-10 mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted/60 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent-cyan animate-pulse" />
          {t("scroll to interpret", "desplázate para interpretar")}
        </div>
      </header>

      {/* INSTRUMENT */}
      <section id="instrument" className="px-6 pb-32 max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted mb-2">
            {t("mode", "modo")} · {mode}
          </div>
          <h2 className="font-serif italic text-3xl text-foreground/90">
            {mode === "rosetta" && t("Translate one concept across every domain", "Traduce un concepto a través de todos los dominios")}
            {mode === "iso" && t("Compare two concepts — find the third", "Compara dos concepciones — encuentra el tercero")}
            {mode === "reflect" && t("Reflect from the structure of the situation", "Reflexiona desde la estructura de la situación")}
          </h2>
        </div>

        {mode === "rosetta" && <RosettaPanel />}
        {mode === "iso" && <IsoPanel />}
        {mode === "reflect" && <ReflectPanel />}
      </section>

      <footer className="border-t border-border px-6 py-12 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-accent-cyan animate-pulse" />
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">{t("system operational", "sistema operativo")}</div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted/60 text-center">
            {t("Two poles in tension produce a third, emergent thing.", "Dos polos en tensión producen un tercero, emergente.")}
          </p>
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent-gold/60">Ξ T R E M V S A F φe φc</div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 flex justify-center">
          <a
            href="https://t.me/Keiserdom"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-accent-cyan/40 rounded-full text-xs font-medium text-accent-cyan hover:bg-accent-cyan hover:text-black transition-colors"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true"><path d="M9.04 15.47 8.7 20.2c.48 0 .69-.2.94-.45l2.26-2.16 4.69 3.42c.86.47 1.47.22 1.7-.79l3.08-14.43h.01c.27-1.26-.45-1.75-1.29-1.44L2.2 9.94c-1.23.48-1.21 1.17-.21 1.48l4.66 1.45 10.83-6.82c.51-.32.97-.14.59.18z"/></svg>
            {t("Contact @Keiserdom on Telegram", "Contactar a @Keiserdom en Telegram")}
          </a>
        </div>
      </footer>
    </div>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useLang();
  const opts: Array<{ id: Lang; label: string }> = [
    { id: "en", label: "EN" },
    { id: "es", label: "ES" },
  ];
  return (
    <div className="flex bg-white/5 p-0.5 rounded-full border border-border">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => setLang(o.id)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider transition-colors ${lang === o.id ? "bg-accent-gold text-background" : "text-muted hover:text-foreground"}`}
          aria-pressed={lang === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ModeSwitcher({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const { t } = useLang();
  const opts: Array<{ id: Mode; label: string }> = [
    { id: "rosetta", label: t("Translate", "Traducir") },
    { id: "iso", label: t("Compare", "Comparar") },
    { id: "reflect", label: t("Reflect", "Reflexionar") },
  ];
  const scrollToInstrument = (m: Mode) => {
    setMode(m);
    setTimeout(() => document.getElementById("instrument")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  return (
    <div className="flex bg-white/5 p-1 rounded-full border border-border">
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => scrollToInstrument(o.id)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${mode === o.id ? "bg-white/10 text-foreground" : "text-muted hover:text-foreground"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
