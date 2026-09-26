import Papa from "papaparse";
import { questionSchema, type Question, type ImportReport } from "./model";
export function fingerprint(text: string) {
  let n = 2166136261;
  for (let i = 0; i < text.length; i++) {
    n ^= text.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return (n >>> 0).toString(16);
}
export function importCsv(
  text: string,
  existing: Question[] = [],
  filename = "Import.csv",
  demo = false,
): { questions: Question[]; report: ImportReport } {
  const parsed = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
      delimitersToGuess: [",", ";", "\t", "|"],
    },
  );
  const report: ImportReport = {
    at: Date.now(),
    filename,
    accepted: 0,
    rejected: 0,
    duplicates: 0,
    delimiter: parsed.meta.delimiter,
    columns: parsed.meta.fields ?? [],
    issues: [],
    warnings: [],
  };
  const required = [
    "question_id",
    "question",
    "answer_a",
    "answer_b",
    "answer_c",
    "answer_d",
    "correct_answer",
    "explanation_short",
  ];
  const missing = required.filter((k) => !report.columns.includes(k));
  if (
    missing.length ||
    Object.keys(parsed.meta.renamedHeaders ?? {}).length ||
    parsed.errors.some((e) => e.type === "Quotes")
  ) {
    report.rejected = parsed.data.length;
    report.issues.push(
      missing.length
        ? `Pflichtspalten fehlen: ${missing.join(", ")}`
        : "Doppelte Spaltennamen oder nicht geschlossenes CSV-Quoting. Datei vollständig abgelehnt.",
    );
    return { questions: [], report };
  }
  const invalidRows = new Set(
    parsed.errors.filter((e) => e.row !== undefined).map((e) => e.row),
  );
  for (const error of parsed.errors)
    report.issues.push(`Datensatz ${(error.row ?? 0) + 1}: ${error.message}`);
  const rows = parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [
        k,
        typeof v === "string" ? v.trim() : "",
      ]),
    ),
  );
  const counts = new Map<string, number>();
  for (const r of rows)
    counts.set(r.question_id, (counts.get(r.question_id) ?? 0) + 1);
  const byId = new Map(rows.map((r) => [r.question_id, r]));
  const existingById = new Map(existing.map((q) => [q.id, q]));
  const resolve = (key: string, seen = new Set<string>()): string => {
    if (seen.has(key)) throw new Error("Zyklische Variantenverknüpfung");
    seen.add(key);
    const old = existingById.get(key);
    if (old) return old.knowledgeId;
    const row = byId.get(key);
    if (!row) throw new Error(`Variantenbezug ${key} fehlt`);
    if (row.variant_of) {
      const target = resolve(row.variant_of, seen);
      if (row.knowledge_id && row.knowledge_id !== target)
        throw new Error("Widerspruch zwischen knowledge_id und variant_of");
      return target;
    }
    return row.knowledge_id || `question:${key}`;
  };
  const questions: Question[] = [];
  for (const [index, row] of rows.entries()) {
    const key = row.question_id;
    if (existingById.has(key)) {
      report.duplicates++;
      report.issues.push(
        `Datensatz ${index + 1}: ID ${key} bereits vorhanden; nicht überschrieben.`,
      );
      continue;
    }
    try {
      if (invalidRows.has(index)) throw new Error("Abweichende Spaltenzahl");
      if (!key) throw new Error("question_id fehlt");
      if (counts.get(key) !== 1)
        throw new Error(
          `ID ${key} mehrfach in Datei; alle betroffenen Zeilen ausgeschlossen`,
        );
      if (
        row.language &&
        !["de", "de-de", "de-at", "de-ch"].includes(row.language.toLowerCase())
      )
        throw new Error("Nur deutschsprachige Fragen unterstützt");
      // This package uses question_type for editorial categories (e.g. Handlung).
      // The four answer fields and single correct_answer define the interaction.
      const values = ["a", "b", "c", "d"].map(
        (letter) => row[`answer_${letter}`],
      );
      if (new Set(values).size !== 4)
        throw new Error("Antworttexte sind nicht eindeutig");
      const raw = row.correct_answer?.toLowerCase().replace(/^answer_/, "");
      const letter = ["a", "b", "c", "d"].includes(raw)
        ? raw
        : ["a", "b", "c", "d"][values.indexOf(row.correct_answer)];
      if (!letter)
        throw new Error(
          "correct_answer muss a–d, answer_a–d oder ein exakter Antworttext sein",
        );
      const level: Record<string, Question["difficulty"]> = {
        "1": "leicht",
        easy: "leicht",
        leicht: "leicht",
        "2": "mittel",
        medium: "mittel",
        mittel: "mittel",
        "3": "schwer",
        hard: "schwer",
        schwer: "schwer",
      };
      if (row.difficulty && !level[row.difficulty.toLowerCase()])
        throw new Error("Unbekannte Schwierigkeit");
      const knowledgeId = resolve(key);
      const urls = (row.source_urls ?? "").split(/[\s;|]+/).filter(Boolean);
      const q = questionSchema.parse({
        id: key,
        knowledgeId,
        version: `csv-${fingerprint(JSON.stringify(row))}`,
        language: "de",
        domain: row.domain || "Importierte Inhalte",
        topic:
          row.franchise ||
          row.film_title_de ||
          row.film_title_original ||
          row.subdomain ||
          row.domain ||
          "Importierte Fragen",
        difficulty: level[row.difficulty?.toLowerCase()] ?? "mittel",
        question: row.question,
        answers: ["a", "b", "c", "d"].map((l) => ({
          id: `${key}:${l}`,
          text: row[`answer_${l}`],
          feedback: row[`feedback_${l}`] || "",
        })),
        correctId: `${key}:${letter}`,
        explanation: row.explanation_short,
        context: row.explanation_context || "",
        anchor: row.memory_anchor || "",
        sources: urls,
        tags: (row.topic_tags || "").split(/[;,|]/).filter(Boolean),
        badgeTags: (row.badge_tags || "").split(/[;,|]/).filter(Boolean),
        metadata: row,
        demo: demo || row.verification_status === "demo-redaktionell",
      });
      questions.push(q);
      if (!row.knowledge_id && !row.variant_of)
        report.warnings.push(
          `${key}: Wissensziel aus Fragen-ID abgeleitet; unmarkierte Varianten werden nicht erkannt.`,
        );
      if (!row.difficulty)
        report.warnings.push(
          `${key}: Schwierigkeit nicht geliefert, vorläufig „mittel“.`,
        );
    } catch (error) {
      report.rejected++;
      report.issues.push(
        `Datensatz ${index + 1} (${key || "ohne ID"}): ${error instanceof Error ? error.message : "Ungültiger Datensatz"}`,
      );
    }
  }
  // A variant may only depend on a successfully accepted target or existing content.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = questions.length - 1; i >= 0; i--) {
      const target = questions[i].metadata.variant_of;
      if (
        target &&
        !existingById.has(target) &&
        !questions.some((q) => q.id === target)
      ) {
        report.issues.push(
          `${questions[i].id}: Variantenbezug wurde ausgeschlossen.`,
        );
        questions.splice(i, 1);
        report.rejected++;
        changed = true;
      }
    }
  }
  report.accepted = questions.length;
  return { questions, report };
}
