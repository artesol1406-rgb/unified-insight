import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { VECTOR_PROMPT, ISO_PROMPT, ISO_DEEP_PROMPT, CHAT_SYSTEM } from "./prompts";

const MODEL = "google/gemini-3-flash-preview";

const VecSchema = z.object({
  Xi: z.number(), T: z.number(), R: z.number(), E: z.number(),
  M: z.number(), V: z.number(), S: z.number(), A: z.number(),
  F: z.number(), phi_e: z.number(), phi_c: z.number(),
});

type RawVec = z.infer<typeof VecSchema>;

function toVec(r: RawVec): Record<string, number> {
  return {
    'Ξ': r.Xi, 'T': r.T, 'R': r.R, 'E': r.E, 'M': r.M, 'V': r.V,
    'S': r.S, 'A': r.A, 'F': r.F, 'φe': r.phi_e, 'φc': r.phi_c,
  };
}

function extractJson(text: string): unknown {
  // strip code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  // find the first { ... last }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response.");
  return JSON.parse(raw.slice(start, end + 1));
}

async function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
  return createLovableAiGatewayProvider(key);
}

function gwError(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
  if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
  throw new Error(msg);
}

const TensionMapSchema = z.object({
  Xi: z.string(), T: z.string(), R: z.string(), E: z.string(),
  M: z.string(), V: z.string(), S: z.string(), A: z.string(),
  F: z.string(), phi_e: z.string(), phi_c: z.string(),
});
const ConceptSchema = z.object({
  vec: VecSchema,
  tensionMap: TensionMapSchema,
  explanation: z.string(),
  polarities: z.array(z.object({
    a: z.string(), b: z.string(), dim: z.string(), note: z.string(),
  })).min(1).max(6),
});

function toTensionMap(r: z.infer<typeof TensionMapSchema>): Record<string, string> {
  return {
    'Ξ': r.Xi, 'T': r.T, 'R': r.R, 'E': r.E, 'M': r.M, 'V': r.V,
    'S': r.S, 'A': r.A, 'F': r.F, 'φe': r.phi_e, 'φc': r.phi_c,
  };
}

export const analyzeConcept = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      concept: z.string().min(1).max(200),
      domain: z.string().min(1).max(40),
      lang: z.enum(["English", "Spanish"]).optional().default("English"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { text } = await generateText({
        model: gateway(MODEL),
        prompt: VECTOR_PROMPT(data.concept, data.domain, data.lang),
      });
      const parsed = ConceptSchema.parse(extractJson(text));
      return {
        vec: toVec(parsed.vec),
        tensionMap: toTensionMap(parsed.tensionMap),
        explanation: parsed.explanation,
        polarities: parsed.polarities,
      };
    } catch (e) { gwError(e); }
  });

const IsoSchema = z.object({
  A: VecSchema,
  B: VecSchema,
  insight: z.string(),
});

export const compareConcepts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      a: z.string().min(1).max(200),
      b: z.string().min(1).max(200),
      lang: z.enum(["English", "Spanish"]).optional().default("English"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { text } = await generateText({
        model: gateway(MODEL),
        prompt: ISO_PROMPT(data.a, data.b, data.lang) +
          `\n\nRespond ONLY with valid JSON in this exact shape, no prose, no code fences:\n{"A":{"Xi":0.0,"T":0.0,"R":0.0,"E":0.0,"M":0.0,"V":0.0,"S":0.0,"A":0.0,"F":0.0,"phi_e":0.0,"phi_c":0.0},"B":{"Xi":0.0,"T":0.0,"R":0.0,"E":0.0,"M":0.0,"V":0.0,"S":0.0,"A":0.0,"F":0.0,"phi_e":0.0,"phi_c":0.0},"insight":"..."}`,
      });
      const parsed = IsoSchema.parse(extractJson(text));
      return {
        vA: toVec(parsed.A),
        vB: toVec(parsed.B),
        insight: parsed.insight,
      };
    } catch (e) { gwError(e); }
  });

const PolesSchema = z.object({
  activeSpace: z.string(),
  receptiveSpace: z.string(),
  activeTime: z.string(),
  receptiveTime: z.string(),
  dynamicSpace: z.string(),
  staticSpace: z.string(),
  dynamicTime: z.string(),
  staticTime: z.string(),
});

const SignsSchema = z.object({
  Xi: z.number(), T: z.number(), R: z.number(), E: z.number(),
  M: z.number(), V: z.number(), S: z.number(), A: z.number(),
  F: z.number(), phi_e: z.number(), phi_c: z.number(),
});

function toSigns(r: z.infer<typeof SignsSchema>): Record<string, -1 | 0 | 1> {
  const norm = (n: number): -1 | 0 | 1 => (n > 0 ? 1 : n < 0 ? -1 : 0);
  return {
    'Ξ': norm(r.Xi), 'T': norm(r.T), 'R': norm(r.R), 'E': norm(r.E),
    'M': norm(r.M), 'V': norm(r.V), 'S': norm(r.S), 'A': norm(r.A),
    'F': norm(r.F), 'φe': norm(r.phi_e), 'φc': norm(r.phi_c),
  };
}

const DeepSchema = z.object({
  vA: VecSchema,
  vB: VecSchema,
  signsA: SignsSchema,
  signsB: SignsSchema,
  tensionsA: z.string(),
  tensionsB: z.string(),
  polesA: PolesSchema,
  polesB: PolesSchema,
  polarityPairs: z.array(z.object({ labelA: z.string(), labelB: z.string(), dim: z.string() })).min(1).max(8),
  matrix: z.object({ spaceTension: z.string(), timeTension: z.string() }),
  isomorphisms: z.object({
    activeExtreme: z.string(),
    receptiveExtreme: z.string(),
    dynamicExtreme: z.string(),
    staticExtreme: z.string(),
  }),
  polarityCore: z.string(),
  analogues: z.array(z.object({ system: z.string(), mapping: z.string() })).min(1).max(6),
  layers: z.object({ concrete: z.string(), human: z.string(), amalgam: z.string() }),
  bridge: z.string(),
  necessity: z.string(),
  caminoAmor: z.string(),
});

export const deepCompare = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      aClaimant: z.string().min(1).max(120),
      aClaim: z.string().min(1).max(4000),
      bClaimant: z.string().min(1).max(120),
      bClaim: z.string().min(1).max(4000),
      lang: z.enum(["English", "Spanish"]).optional().default("English"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { text } = await generateText({
        model: gateway(MODEL),
        prompt: ISO_DEEP_PROMPT(data.aClaimant, data.aClaim, data.bClaimant, data.bClaim, data.lang),
      });
      const parsed = DeepSchema.parse(extractJson(text));
      return {
        vA: toVec(parsed.vA),
        vB: toVec(parsed.vB),
        signsA: toSigns(parsed.signsA),
        signsB: toSigns(parsed.signsB),
        tensionsA: parsed.tensionsA,
        tensionsB: parsed.tensionsB,
        polesA: parsed.polesA,
        polesB: parsed.polesB,
        polarityPairs: parsed.polarityPairs,
        matrix: parsed.matrix,
        isomorphisms: parsed.isomorphisms,
        polarityCore: parsed.polarityCore,
        analogues: parsed.analogues,
        layers: parsed.layers,
        bridge: parsed.bridge,
        necessity: parsed.necessity,
        caminoAmor: parsed.caminoAmor,
      };
    } catch (e) { gwError(e); }
  });

export const reflect = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })).min(1).max(40),
      lang: z.enum(["English", "Spanish"]).optional().default("English"),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { text } = await generateText({
        model: gateway(MODEL),
        system: CHAT_SYSTEM(data.lang),
        messages: data.messages,
      });
      return { text };
    } catch (e) { gwError(e); }
  });
