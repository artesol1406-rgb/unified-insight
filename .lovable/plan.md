# 1+1=3 — The Universal Interpreter

A polarity-synthesis engine. Any concept gets projected into an 11-dimensional space (Ξ, T, R, E, M, V, S, A, F, φe, φc) and translated across 8 domains (physics, music, psychology, narrative, biology, math, philosophy, ecology). Three modes — Rosetta (translate one concept), Iso (compare two), Reflect (chat from the structure).

## Visual direction

Locked to **Prismatic Instrument**: black background (#060709), Inter Tight display + Inter body + JetBrains Mono + Playfair italic accent, accents in cyan / magenta / gold. Composition, tokens, and section structure copied from the prototype verbatim.

## Build steps

1. **Enable Lovable Cloud** (provisions `LOVABLE_API_KEY`) so AI calls have a backend.
2. **Design tokens** — port the prototype's color/font tokens into `src/styles.css` (`@theme` + `@theme inline`); add the keyframes (`intro-assemble`, `pulse-shimmer`, `float-slow`, `geometry-evolve`, `flower-bloom`). Load the four Google fonts via `<link>` in `__root.tsx` head.
3. **Domain data** — extract `DIMS`, `DIM_DESC`, `DOMAINS`, `fisherRao`, `toSignature`, `normalize`, `translate`, `makeSentence` from the upload into `src/lib/amalgam/engine.ts` (pure TS, no React).
4. **Server function** — `src/lib/amalgam/amalgam.functions.ts` with three `createServerFn` calls (`analyzeConcept`, `compareConcepts`, `reflect`) that hit Lovable AI Gateway via `google/gemini-3-flash-preview` using the prompts from the upload (`VECTOR_PROMPT`, `ISO_PROMPT`, `CHAT_SYSTEM`). Vector calls use the AI SDK `Output.object` schema for the 11D JSON; chat is a plain `generateText`.
5. **Intro animation** — `src/components/IntroAnimation.tsx`: a single `<canvas>` driven by an rAF loop that runs once on first load and animates these phases:
   - chaotic colored particles drifting
   - particles pair with their polar-opposite color and attract
   - pairs merge into triangles
   - triangles → squares → pentagons → hexagons (one beat each)
   - polygons dissolve into bubbles
   - bubbles settle into the Flower of Life
   - holographic 2.5D crystalline overlay shimmers in (chromatic-aberration via three offset SVG copies)
   - hands off to the hero (fade through `intro-assemble`)
   Skippable with click/Esc; remembered in `sessionStorage` so subsequent navigation skips it.
6. **Hero** — wordmark "1+1=3" (Inter Tight black, gold italic Playfair equals), subtitle, concept input + Analyze button, pre-rendered chip buttons (Entropy / Silence / Revolution / Love / Forgiveness / Memory / Order / Chaos) that one-tap-fill and submit.
7. **Mode switcher** — pill toggle in the fixed nav (Rosetta / Iso / Reflect), state lifted in the route component.
8. **Rosetta panel** — left column: 11-spoke radial SVG chart of the signature vector + the Σ signature string + per-dimension bars. Right column: 7 cross-domain translation cards (one per non-source domain), each with a domain pill (cyan/magenta/gold rotating), a one-sentence rendering from `makeSentence`, and the top dimensions used.
9. **Iso panel** — two concept inputs side by side; on submit, fetch both vectors + insight; render the two signatures and an **emergent "third" panel** in the middle showing the midpoint vector, Fisher–Rao distance, and the LLM's one-sentence insight ("1+1=3" made literal).
10. **Reflect panel** — chat surface (messages list + composer); each user turn calls the `reflect` server function with the running history; responses styled with Σ signatures highlighted in mono.
11. **Domain seed sentences** — keep `makeSentence` as the fast deterministic translator; the vector call powers the radial chart and signature.
12. **Error surfacing** — show 429 / 402 / validation errors inline in each panel, preserve user input.
13. **SEO + favicon** — title "1+1=3 — The Universal Interpreter", meta description on the polarity thesis, OG tags, single H1 on hero.
14. **Verify** — run build, open preview, trigger one Rosetta call, one Iso call, one Reflect turn, confirm intro animation runs and is skippable.

## Technical details

- Routing: single page `src/routes/index.tsx` hosts all three modes (state-switched), keeps URL clean and intro animation persistent.
- AI: AI SDK + `@ai-sdk/openai-compatible` with the Lovable AI Gateway helper in `src/lib/ai-gateway.server.ts`. Vector calls use `generateText` + `Output.object` with a flat Zod schema for the 11 keys (no enums, no nested polymorphism — keeps Gemini's structured-output state machine small).
- The intro canvas is pure 2D Canvas API (no Three.js — would break the Worker SSR runtime). Sacred geometry is drawn from a precomputed list of 19 circle centers (Flower of Life). Holographic shimmer is achieved by drawing the lattice three times at sub-pixel offsets in cyan/magenta/gold with `globalCompositeOperation = 'screen'`.
- No database needed — the app is stateless beyond the in-memory chat thread. (Can be added later if the user wants saved sessions.)
- File layout:
  ```text
  src/
    routes/index.tsx                       (page + mode state)
    components/
      IntroAnimation.tsx
      RosettaPanel.tsx
      IsoPanel.tsx
      ReflectPanel.tsx
      SignatureChart.tsx
      DomainCard.tsx
      ModeSwitcher.tsx
    lib/
      amalgam/
        engine.ts                           (pure: DIMS, DOMAINS, math, translate)
        prompts.ts                          (VECTOR_PROMPT, ISO_PROMPT, CHAT_SYSTEM)
        amalgam.functions.ts                (createServerFn × 3)
      ai-gateway.server.ts                  (Lovable AI Gateway helper)
    styles.css                              (tokens + keyframes)
  ```
