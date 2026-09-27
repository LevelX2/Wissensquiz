import { importCsv } from "./importer";
import type { State } from "./model";
import { applyCategoryTags } from "./categories";
import { addFilmFacts } from "./filmFacts";
import { retainJourneyUnlocks } from "./learningPath";

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
];
export type PackageContent = { filename: string; text: string };
export function hasPackage(state: State, filename: string) {
  return state.imports.some(
    (r) => r.filename === filename && r.accepted + r.duplicates > 0,
  );
}
// Apply inside the IndexedDB transaction: concurrent tabs must not import twice.
export function addPackages(state: State, incoming: PackageContent[]) {
  // Freeze rights from the old catalog before adding earlier/new film groups.
  retainJourneyUnlocks(state);
  for (const pkg of incoming) {
    if (hasPackage(state, pkg.filename)) continue;
    const imported = importCsv(pkg.text, state.questions, pkg.filename);
    if (!imported.report.accepted && !imported.report.duplicates)
      throw new Error(`Fragenpaket ${pkg.filename} ist ungültig.`);
    state.questions.push(...imported.questions);
    state.imports.push(imported.report);
  }
  applyCategoryTags(state.questions);
  addFilmFacts(state.questions);
}
