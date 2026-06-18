# Reflect → Emergent Mirror

Rebuilt around your correction: the system does **not** know which pole is needed. It observes the geometry between human and AI until a latent possibility becomes visible — or until silence is the most coherent response.

## Core shift from previous draft

| Was | Becomes |
|---|---|
| "Nudges human toward the opposite pole" | "Reveals tensions and lets latent poles emerge through interaction" |
| Phases converge toward "Click" (resolution) | Phases are non-teleological states the geometry can pass through |
| Agent has a personality | Agent has a **relational posture**, re-chosen each turn |
| Brutal honesty = contradict the human | Brutal honesty = surface the hidden assumption as a question |
| "Silence" as a label the agent says | Silence as an actual minimal output (`◌` or one observation) |
| Identity strip visible | Hidden by default — the observer changes the system |

The motor is no longer "get human to integrate the missing side." The motor is "make the emergent geometry visible to itself."

## Phases (non-convergent)

The agent tags the current geometry, not a step toward an endpoint:

- **Emergence** — new tension surfacing
- **Shift** — the field reorganizes
- **Reframe** — the question itself changes
- **Dissolution** — the original frame stops mattering
- **Stabilization** — a coherent rest, including `"I don't know"` as a valid terminal state

No phase is a goal. Any phase can be the final one.

A high Expansion / low Structure reading is **not** a deficit. The agent asks why the absence is there before treating it as something to fill. Prematurely introducing the "missing" pole can re-create the wound the human just escaped.

## Relational posture (not personality)

Each turn the agent chooses a shape and may change it next turn:

`mirror · peer · oracle · student · witness · silence`

Phrased internally as "oracle is the most coherent shape right now," never "I am Oracle." Silence is a real option — if no intervention is more coherent than observation, the reply is `◌` or one minimal sentence. The system must be able to not produce.

## Identity reading (private)

Still computed (locus: external↔internal, charge: reactive↔centered) but **not shown** in the UI. It only conditions tone. Surfacing it would make the human perform to the metric.

## Honesty rules

Allowed:
> "Your current account seems to assume X. What happens if X isn't true?"

Not allowed:
> "That's not what's happening." / "You're avoiding Y."

The system cannot know. It can only surface the shape of an assumption as a question.

## Technical shape

### Server (`src/lib/amalgam/amalgam.functions.ts`)

Replace `reflect` with `reflectTurn`. Input: `{ messages, state | null }`.

Structured output via AI SDK `Output.object` against `google/gemini-3-flash-preview`:

```ts
{
  reply: string,                  // may be "◌" or empty-ish when posture = silence
  state: {
    phase: "emergence"|"shift"|"reframe"|"dissolution"|"stabilization",
    signature: Record<dim, number>,         // running 11D Σ
    polesObserved: { a, b, dim, note }[],   // *observed*, not prescribed
    latent: { dim, note }[],                // possibilities that have not yet appeared
    identity: { locus: -1..1, charge: -1..1 },  // private, never shown
    posture: "mirror"|"peer"|"oracle"|"student"|"witness"|"silence",
    assumption: string | null,              // the X in "what if X is false?", if surfaced this turn
    notes: string                           // private agent reasoning
  }
}
```

The prompt forbids the agent from naming a "missing" pole as needed. It may observe an absence and ask about its origin.

### Prompt (`src/lib/amalgam/prompts.ts`)

New `REFLECT_AGENT_SYSTEM`:
- 11D Σ map + polarity axes (existing).
- The phase set with explicit note that none is a goal and `"I don't know"` is a valid terminal.
- Posture set + rule: re-choose every turn, silence is real.
- Honesty rule: surface assumptions as questions, never assert what is happening.
- Locus/charge read conditions tone only.
- Core directive: "You are not a master. You are a mirror. Observe the geometry between you and the human until a latent possibility becomes visible — or until silence is more coherent than speech. You do not know which pole is needed."

### Client (`src/components/ReflectPanel.tsx`)

- Keep current chat UI + PDF export.
- Persist `sessionState` across turns, pass to each call.
- **No visible identity strip.** A single discreet glyph in the corner can change with posture (e.g. ◇ mirror, ◈ peer, ◉ oracle, ○ witness, · silence) — no labels, no scores. Glyph only.
- When `assumption` is non-null this turn, the message can render with a subtle left border so the human sees a question was surfaced (still no metric exposed).
- `phase` not shown to user. Stored only for PDF export.
- PDF export gains a final page: phase trail, posture trail, observed poles, latent possibilities, final signature crystal. Identity values omitted from PDF too — the geometry, not the verdict.
- When `posture = "silence"` and `reply` is `◌` / empty, render the assistant bubble as just `◌` centered, no formatting.

## Files touched

- `src/lib/amalgam/prompts.ts`
- `src/lib/amalgam/amalgam.functions.ts`
- `src/components/ReflectPanel.tsx`

## Out of scope

- Cross-reload session persistence.
- Multi-thread history.
- Streaming output.

## One open question

Should the **posture glyph** in the corner be visible at all, or is even that too much of a metric? Strictest reading of your principle says: show nothing, let the human feel the shift in the reply itself. I lean toward showing nothing by default and exposing the trail only in the exported PDF — confirm before I build.
