import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { VECTOR_PROMPT, ISO_PROMPT, CHAT_SYSTEM } from "./prompts";

const MODEL = "google/gemini-2.5-flash";

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

export const analyzeConcept = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ concept: z.string().min(1).max(200), domain: z.string().min(1).max(40) }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { experimental_output } = await generateText({
        model: gateway(MODEL),
        prompt: VECTOR_PROMPT(data.concept, data.domain),
        experimental_output: Output.object({ schema: VecSchema }),
      });
      return { vec: toVec(experimental_output) };
    } catch (e) { gwError(e); }
  });

const IsoSchema = z.object({
  A: VecSchema,
  B: VecSchema,
  insight: z.string(),
});

export const compareConcepts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ a: z.string().min(1).max(200), b: z.string().min(1).max(200) }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { experimental_output } = await generateText({
        model: gateway(MODEL),
        prompt: ISO_PROMPT(data.a, data.b),
        experimental_output: Output.object({ schema: IsoSchema }),
      });
      return {
        vA: toVec(experimental_output.A),
        vB: toVec(experimental_output.B),
        insight: experimental_output.insight,
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
    }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const gateway = await getGateway();
      const { text } = await generateText({
        model: gateway(MODEL),
        system: CHAT_SYSTEM,
        messages: data.messages,
      });
      return { text };
    } catch (e) { gwError(e); }
  });
