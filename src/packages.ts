import { importCsv } from "./importer";
import type { State } from "./model";
import { applyCategoryTags } from "./categories";
import { addFilmFacts } from "./filmFacts";
import { retainJourneyUnlocks } from "./learningPath";
import Papa from "papaparse";

export const packages = [
  { path: "/fragen.csv", filename: "SciFi_Quiz_180_Fragen.csv" },
  { path: "/action-fragen.csv", filename: "Action_Quiz_180_Fragen.csv" },
  { path: "/horror-fragen.csv", filename: "Horror_Quiz_180_Fragen.csv" },
  { path: "/fantasy-fragen.csv", filename: "Fantasy_Quiz_180_Fragen.csv" },
  { path: "/komoedie-fragen.csv", filename: "Komoedie_Quiz_180_Fragen.csv" },
  { path: "/western-fragen.csv", filename: "Western_Quiz_180_Fragen.csv" },
  { path: "/drama-fragen.csv", filename: "Drama_Quiz_180_Fragen.csv" },
  { path: "/classics-fragen.csv", filename: "Classics_Quiz_180_Fragen.csv" },
  {
    path: "/martialarts-fragen.csv",
    filename: "MartialArts_Quiz_180_Fragen.csv",
  },
  { path: "/romcom-fragen.csv", filename: "RomCom_Quiz_180_Fragen.csv" },
  { path: "/arthouse-fragen.csv", filename: "Arthouse_Quiz_180_Fragen.csv" },
  { path: "/musik-fragen.csv", filename: "Musik_Ergaenzung_180_Fragen.csv" },
  {
    path: "/scifi-ergaenzung-fragen.csv",
    filename: "SciFi_Ergaenzung_360_Fragen.csv",
  },
  {
    path: "/komoedie-ergaenzung-fragen.csv",
    filename: "Komoedie_Ergaenzung_360_Fragen.csv",
  },
  {
    path: "/alle-genres-120-filme-fragen.csv",
    filename: "Alle_Genres_120_Filme_960_Fragen.csv",
  },
  {
    path: "/preistraeger-fragen.csv",
    filename: "Preistraeger_200_Fragen.csv",
  },
  {
    path: "/schauspieler-fragen.csv",
    filename: "Schauspieler_800_Fragen_App.csv",
  },
  {
    path: "/schauspieler-p02-fragen.csv",
    filename: "Schauspieler_Ergaenzung_P02_200_Fragen_App.csv",
  },
  {
    path: "/schauspieler-p03-fragen.csv",
    filename: "Schauspieler_Ergaenzung_P03_400_Fragen_App.csv",
  },
  {
    path: "/film-ergaenzung-240-fragen.csv",
    filename: "Filmfragen_240_Filme_1920_Fragen.csv",
  },
  {
    path: "/schauspieler-bilder-fragen.csv",
    filename: "Schauspieler_Bilderkennung_200_Fragen.csv",
  },
  {
    path: "/film-erweiterung-20261007-fragen.csv",
    filename: "Filmfragen_20261007.csv",
  },
  {
    path: "/personen-erweiterung-20261007-fragen.csv",
    filename: "Personenfragen_20261007.csv",
  },
  {
    path: "/preise-erweiterung-20261007-fragen.csv",
    filename: "Preisefragen_20261007.csv",
  },
  {
    path: "/genre100-abenteuer-fragen.csv",
    filename: "Genre100_Abenteuer_20261008.csv",
  },
  {
    path: "/genre100-thriller-fragen.csv",
    filename: "Genre100_Thriller_20261008.csv",
  },
  {
    path: "/genre100-action-fragen.csv",
    filename: "Genre100_Action_20261008.csv",
  },
  {
    path: "/genre100-martialarts-fragen.csv",
    filename: "Genre100_MartialArts_20261008.csv",
  },
  {
    path: "/genre100-musik-fragen.csv",
    filename: "Genre100_Musik_20261008.csv",
  },
  {
    path: "/genre100-romcom-fragen.csv",
    filename: "Genre100_RomCom_20261008.csv",
  },
  {
    path: "/genre100-western-fragen.csv",
    filename: "Genre100_Western_20261008.csv",
  },
  {
    path: "/genre100-fantasy-fragen.csv",
    filename: "Genre100_Fantasy_20261008.csv",
  },
];
export type PackageContent = { filename: string; text: string };
export function hasPackage(state: State, filename: string) {
  return state.imports.some(
    (r) => r.filename === filename && r.accepted + r.duplicates > 0,
  );
}
// Apply inside the IndexedDB transaction: concurrent tabs must not import twice.
export function addPackages(state: State, incoming: PackageContent[]) {
  state.bundledQuestionIds ??= [];
  // Freeze rights from the old catalog before adding earlier/new film groups.
  retainJourneyUnlocks(state);
  for (const pkg of incoming) {
    if (hasPackage(state, pkg.filename)) continue;
    // Person questions may share generated director goals from the film catalog.
    if (pkg.filename === "Schauspieler_800_Fragen_App.csv")
      addFilmFacts(state.questions);
    const imported = importCsv(pkg.text, state.questions, pkg.filename);
    if (!imported.report.accepted && !imported.report.duplicates)
      throw new Error(`Fragenpaket ${pkg.filename} ist ungültig.`);
    state.questions.push(...imported.questions);
    state.imports.push(imported.report);
  }
  applyCategoryTags(state.questions);
  addFilmFacts(state.questions);
  if (incoming.length) {
    const official = incoming
      .filter((pkg) => packages.some((p) => p.filename === pkg.filename))
      .flatMap((pkg) => {
        // Validate every bundled row again, including variants whose target is
        // in another package. Existing user questions with the same ID are
        // retained and only recognized as bundled if their version matches.
        const rows = Papa.parse<Record<string, string>>(pkg.text, {
          header: true,
          skipEmptyLines: "greedy",
          transformHeader: (h) => h.trim().toLowerCase(),
        }).data;
        const ids = new Set(rows.map((row) => row.question_id?.trim()));
        return importCsv(
          pkg.text,
          state.questions.filter((q) => !ids.has(q.id)),
          pkg.filename,
        ).questions;
      });
    addFilmFacts(official);
    const existing = new Map(state.questions.map((q) => [q.id, q]));
    state.bundledQuestionIds = [
      ...new Set([
        ...(state.bundledQuestionIds ?? []),
        ...official
          .filter((q) => {
            const actual = existing.get(q.id);
            return (
              actual?.version === q.version &&
              actual.knowledgeId === q.knowledgeId
            );
          })
          .map((q) => q.id),
      ]),
    ].filter((id) => existing.has(id));
  }
}
