import { expect, it } from "vitest";
import {
  accountConfig,
  accountStorageKey,
  parseAccountLink,
} from "../src/accounts";
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
it("trennt Kontoschlüssel nach Projekt und Spieler", () => {
  const keys = [
    accountStorageKey("https://one.supabase.co", "alice"),
    accountStorageKey("https://one.supabase.co", "bob"),
    accountStorageKey("https://two.supabase.co", "alice"),
  ];
  expect(new Set(keys).size).toBe(3);
});
