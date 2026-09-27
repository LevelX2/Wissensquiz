import { expect, it } from "vitest";
import { emptyState } from "../src/model";
import { readRoundSetup } from "../src/roundSetup";
import { validateBackup } from "../src/storage";

it("liest alte Sicherungen ohne Rundenauswahl und erhält historische Favoriten", () => {
  const state = emptyState();
  state.favorites = ["Alien"];
  const before = structuredClone(state);
  expect(readRoundSetup(validateBackup(state))).toEqual({
    mode: "entdecken",
    familiarities: [1, 2, 3, 4],
    genres: null,
    categories: [],
    difficulties: ["leicht", "mittel", "schwer"],
  });
  expect(state).toEqual(before);
  expect(validateBackup(state).favorites).toEqual(["Alien"]);
});

it("erhält leere Auswahl, Modus, Kategorien und manuelle Stufen durch die Sicherungsvalidierung", () => {
  const state = emptyState();
  state.settings.roundSetup = {
    mode: "ueben",
    familiarities: [1, 3],
    genres: [],
    categories: ["Classics", "Arthouse"],
    difficulties: [],
  };
  expect(
    readRoundSetup(validateBackup(JSON.parse(JSON.stringify(state)))),
  ).toEqual(state.settings.roundSetup);
  state.settings.roundSetup.genres = ["Nicht mehr importiert"];
  expect(readRoundSetup(state).genres).toBeNull();
  state.settings.roundSetup.difficulties = ["schwer"];
  state.settings.allDifficulties = false;
  expect(readRoundSetup(validateBackup(state)).difficulties).toEqual([
    "schwer",
  ]);
});
