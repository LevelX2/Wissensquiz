import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { catalogIndex } from "../src/catalogIndex";
import { categories, matchesCategories, matchesTopic } from "../src/categories";
import { genreOf, questionSourceOf } from "../src/filters";
import { emptyState } from "../src/model";
import { addPackages, packages } from "../src/packages";

it("erhält Themen-, Kategorie- und Quellenverträge auch bei kollidierenden Importnamen", () => {
  const state = emptyState();
  addPackages(state, packages.map((p) => ({ filename: p.filename, text: readFileSync(`public${p.path}`, "utf8") })));
  const questions = state.questions;
  questions.push({ ...questions[0], id: "collision", topic: "Classics" });
  const index = catalogIndex(questions);
  for (const topic of [...index.topics, "Alle Themen", "Classics + Arthouse", "Filmfragen + Classics", "Classics: Casablanca", "nicht vorhanden"])
    expect(index.forTopic(topic).map((q) => q.id)).toEqual(questions.filter((q) => matchesTopic(q, topic)).map((q) => q.id));
  for (const c of categories)
    expect(index.curated.get(c)).toEqual(questions.filter((q) => matchesCategories(q, [c])));
  for (const [g, qs] of index.genres)
    expect(qs).toEqual(questions.filter((q) => questionSourceOf(q) === "film" && genreOf(q) === g));
  const changed = questions.map((q) => q.id === "collision" ? { ...q, topic: "Anderer Film" } : q);
  expect(catalogIndex(changed).forTopic("Anderer Film").map((q) => q.id)).toEqual(["collision"]);
  expect(index.forTopic("Anderer Film")).toEqual([]);
});
