import { expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  accountConfig,
  accountStorageKey,
  parseAccountLink,
  cloudRevision,
  rememberRevision,
  replaceAccountState,
  cloudSave,
  CloudSaveError,
} from "../src/accounts";
import { emptyState } from "../src/model";
import { read, update } from "../src/storage";
import type { SupabaseClient } from "@supabase/supabase-js";

it("unterscheidet abgelehnte Anmeldung, zu große Sicherung, Überlastung und Serverfehler ohne private Servertexte anzuzeigen", async () => {
  for (const [status, expected] of [
    [401, "Zugriff abgelehnt"],
    [413, "Größe"],
    [429, "zu viele Anfragen"],
    [503, "Serverfehler"],
  ] as const) {
    const client = {
      rpc: async () => ({
        data: null,
        status,
        error: { message: "private interne Serverangabe" },
      }),
    } as unknown as SupabaseClient;
    const original = emptyState();
    const saved = structuredClone(original);
    await expect(
      cloudSave(client, original, 0, "test-user"),
    ).rejects.toBeInstanceOf(CloudSaveError);
    await expect(cloudSave(client, original, 0, "test-user")).rejects.toThrow(
      expected,
    );
    expect(original).toEqual(saved);
  }
});
it("akzeptiert nur freigegebene öffentliche Kontokonfiguration, niemals geheime API-Schlüssel", () => {
  expect(
    accountConfig({ enabled: false, supabaseUrl: "", publishableKey: "" }),
  ).toBeNull();
  const config = {
    enabled: true,
    supabaseUrl: "https://test.supabase.co",
    publishableKey: "sb_publishable_test",
  };
  expect(accountConfig(config)?.supabaseUrl).toBe(config.supabaseUrl);
  for (const url of [
    "https://example.com",
    "http://test.supabase.co",
    "https://test.supabase.co.evil.com",
    "https://secret@test.supabase.co",
    "https://test.supabase.co/?key=x",
  ])
    expect(() => accountConfig({ ...config, supabaseUrl: url })).toThrow();
  expect(() =>
    accountConfig({ ...config, publishableKey: "sb_secret_never_in_browser" }),
  ).toThrow();
});
it("akzeptiert nur Bestätigung und Recovery, ohne fremde Weiterleitungsziele", () => {
  const token = "a".repeat(64);
  expect(
    parseAccountLink(
      `#auth?token_hash=${token}&type=recovery&redirect=https://evil.example`,
    ),
  ).toEqual({ type: "recovery", token_hash: token });
  expect(parseAccountLink("#home")).toBeNull();
  expect(() =>
    parseAccountLink(`#auth?token_hash=${token}&type=admin`),
  ).toThrow();
  expect(() => parseAccountLink("#auth?type=signup")).toThrow();
});
it("trennt Gast, zwei Spieler und zwei Projekte auch bei verzögerten Schreibvorgängen", async () => {
  const a = accountStorageKey("https://one.supabase.co", "alice"),
    b = accountStorageKey("https://one.supabase.co", "bob");
  const other = accountStorageKey("https://two.supabase.co", "alice");
  await update((s) => Object.assign(s, emptyState()));
  await Promise.all([
    update((s) => {
      s.favorites = ["Gast"];
    }),
    update(
      (s) => {
        s.favorites = ["Alice"];
      },
      emptyState(),
      a,
    ),
    update(
      (s) => {
        s.favorites = ["Bob"];
      },
      emptyState(),
      b,
    ),
  ]);
  expect((await read())?.favorites).toEqual(["Gast"]);
  expect((await read(a))?.favorites).toEqual(["Alice"]);
  expect((await read(b))?.favorites).toEqual(["Bob"]);
  expect(await read(other)).toBeUndefined();
  await replaceAccountState(a, (await read())!);
  expect((await read())?.favorites).toEqual(["Gast"]);
  expect((await read(b))?.favorites).toEqual(["Bob"]);
  expect((await read(a))?.favorites).toEqual(["Gast"]);
  await rememberRevision(a, 5);
  expect(await cloudRevision(a)).toBe(5);
  expect(await cloudRevision(b)).toBe(0);
  await expect(replaceAccountState("current", emptyState())).rejects.toThrow();
});
