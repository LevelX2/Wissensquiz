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
import { openDatabase } from "../src/storage";
import { listRecoveryCopies, readRecoveryCopy } from "../src/recoveryCopies";
import type { SupabaseClient } from "@supabase/supabase-js";

it("exportiert neue und alte Rückfallkopien nur für das ausgewählte Konto ohne aktive Stände zu verändern", async () => {
  const key = accountStorageKey("https://one.supabase.co", "recovery-alice");
  const other = accountStorageKey("https://one.supabase.co", "recovery-bob");
  const old = { ...emptyState(), favorites: ["Vorher"] };
  await update((s) => Object.assign(s, old), undefined, key);
  await replaceAccountState(key, emptyState());
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    tx.objectStore("state").put(old, `recovery:${key}:legacy`);
    tx.objectStore("state").put(old, `recovery:${other}:foreign`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const copies = await listRecoveryCopies(key);
  expect(copies).toHaveLength(2);
  expect(copies[0].createdAt).toBeTypeOf("number");
  expect(copies[1].createdAt).toBeNull();
  for (const copy of copies)
    expect((await readRecoveryCopy(key, copy.key)).favorites).toEqual([
      "Vorher",
    ]);
  await expect(readRecoveryCopy(other, copies[0].key)).rejects.toThrow(
    "gehört nicht",
  );
  await expect(listRecoveryCopies("current")).rejects.toThrow();
  expect((await read(key))!.favorites).toEqual([]);
});

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
