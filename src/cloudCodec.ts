import { z } from "zod";
import { questionSchema, type Question, type State } from "./model";

const FORMAT = "quiz-cloud-compact-v2";
const MAX_CATALOG_BYTES = 64 * 1024 * 1024;
const envelope = z
  .object({
    storageFormat: z.enum(["quiz-cloud-compact-v1", FORMAT]),
    questions: z.object({
      encoding: z.literal("gzip-base64"),
      data: z.string().max(20000000),
    }),
    rounds: z
      .array(z.object({ questions: z.array(z.unknown()) }).passthrough())
      .max(100000),
  })
  .passthrough();
const reference = z.object({
  reference: z.literal(true),
  id: z.string(),
  version: z.string(),
  correctId: z.string(),
  domain: z.string(),
  difficulty: z.string(),
  metadata: z.object({ subdomain: z.string().optional() }),
  changes: z.record(z.string(), z.unknown()),
});
const scoreFields = (q: Question) => ({
  id: q.id,
  version: q.version,
  correctId: q.correctId,
  domain: q.domain,
  difficulty: q.difficulty,
  metadata:
    q.metadata.subdomain === undefined
      ? {}
      : { subdomain: q.metadata.subdomain },
});

// SQL ranking projections only read these small fields, never the question catalog.
// The complete catalog stays portable, including custom imports and old versions.
export async function encodeCloudState(state: State) {
  if (
    typeof CompressionStream === "undefined" ||
    typeof DecompressionStream === "undefined"
  )
    return state;
  const bytes = new TextEncoder().encode(JSON.stringify(state.questions));
  if (bytes.length > MAX_CATALOG_BYTES)
    throw new Error("Der Fragenkatalog ist für die Online-Sicherung zu groß.");
  const compressed = new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer(),
  );
  let binary = "";
  for (let i = 0; i < compressed.length; i += 8192)
    binary += String.fromCharCode(...compressed.subarray(i, i + 8192));
  const byId = new Map(state.questions.map((q) => [q.id, q]));
  return {
    ...state,
    storageFormat: FORMAT,
    // An old client rejects this object rather than silently dropping custom questions.
    questions: { encoding: "gzip-base64" as const, data: btoa(binary) },
    rounds: state.rounds.map((r) => ({
      ...r,
      questions: r.questions.map((q) => {
        const base = byId.get(q.id);
        if (!base || base.version !== q.version) return q;
        const changes = Object.fromEntries(
          Object.entries(q).filter(
            ([key, value]) =>
              JSON.stringify(value) !==
              JSON.stringify(base[key as keyof Question]),
          ),
        );
        return { reference: true as const, ...scoreFields(q), changes };
      }),
    })),
  };
}

export async function decodeCloudState(value: unknown): Promise<unknown> {
  if (!value || typeof value !== "object" || !("storageFormat" in value))
    return value;
  const packed = envelope.parse(value);
  if (typeof DecompressionStream === "undefined")
    throw new Error(
      "Dieser Browser kann die kompakte Sicherung nicht lesen. Bitte aktualisiere Deinen Browser.",
    );
  const bytes = Uint8Array.from(atob(packed.questions.data), (c) =>
    c.charCodeAt(0),
  );
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > MAX_CATALOG_BYTES)
        throw new Error("Der Fragenkatalog der Sicherung ist zu groß.");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const catalogBytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    catalogBytes.set(chunk, offset);
    offset += chunk.length;
  }
  const questions = z
    .array(questionSchema)
    .max(20000)
    .parse(JSON.parse(new TextDecoder().decode(catalogBytes)));
  const byId = new Map(questions.map((q) => [q.id, q]));
  const rounds = packed.rounds.map((r) => ({
    ...r,
    questions: r.questions.map((item) => {
      if (!item || typeof item !== "object" || !("reference" in item))
        return item;
      const ref = reference.parse(item);
      const base = byId.get(ref.id);
      if (!base || base.version !== ref.version)
        throw new Error("Ein Fragenverweis der Sicherung ist ungültig.");
      const q = questionSchema.parse({ ...base, ...ref.changes });
      if (
        JSON.stringify(scoreFields(q)) !==
        JSON.stringify(scoreFields(ref as unknown as Question))
      )
        throw new Error("Die Ergebnisdaten passen nicht zum Fragenverweis.");
      return q;
    }),
  }));
  const { storageFormat: _, ...state } = packed;
  return { ...state, questions, rounds };
}
