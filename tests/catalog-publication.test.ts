import { beforeAll, afterAll, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { syncFixture } from "./helpers/sync-fixture";
import { importCsv } from "../src/importer";
import { prepareRelease } from "../src/syncCodec";

let fixture: Awaited<ReturnType<typeof syncFixture>>;
beforeAll(async () => {
  fixture = await syncFixture();
}, 30000);
afterAll(() => fixture.db.close());
it("gibt nur vollständige unveränderte Betreiberpakete atomar und wiederholbar frei", async () => {
  const release = await prepareRelease(
    importCsv(readFileSync("public/fragen.csv", "utf8")).questions.slice(0, 3),
  );
  const scoreFields = release.questions.map((q) => ({
    id: q.id,
    version: q.version,
    correctId: q.correctId,
    domain: q.domain,
    difficulty: q.difficulty,
    metadata: {},
  }));
  const manifest = JSON.stringify({
    ...release,
    protocol: 1,
    scoreFields,
    questionCount: 3,
  });
  const hash = createHash("sha256").update(manifest).digest("hex");
  const parts = [manifest.slice(0, 100), manifest.slice(100)];
  const stage = (part: number, content = parts[part], proof = hash) =>
    fixture.db.query(
      "insert into quiz_sync_internal.catalog_publication_parts values($1,$2,2,$3)",
      [proof, part, content],
    );
  const publish = (proof = hash) =>
    fixture.db.query("select quiz_sync_internal.publish_catalog($1) as hash", [
      proof,
    ]);
  await stage(0);
  await expect(publish()).rejects.toThrow("incomplete_catalog_publication");
  expect(
    (await fixture.db.query("select * from public.quiz_catalog_releases")).rows,
  ).toHaveLength(0);
  await stage(1);
  expect((await publish()).rows).toEqual([{ hash: release.hash }]);
  expect(
    (
      await fixture.db.query(
        "select * from quiz_sync_internal.catalog_publication_parts",
      )
    ).rows,
  ).toHaveLength(0);
  await stage(0);
  await stage(1);
  await publish();
  const corrupt = "a".repeat(64);
  await stage(0, parts[0], corrupt);
  await stage(1, parts[1], corrupt);
  await expect(publish(corrupt)).rejects.toThrow(
    "catalog_publication_hash_mismatch",
  );
  expect(
    (await fixture.db.query("select * from public.quiz_catalog_releases")).rows,
  ).toHaveLength(1);
  const changed = JSON.stringify({
    ...release,
    scoreFields,
    questionCount: 3,
    protocol: 2,
  });
  const changedHash = createHash("sha256").update(changed).digest("hex");
  await fixture.db.query(
    "insert into quiz_sync_internal.catalog_publication_parts values($1,0,1,$2)",
    [changedHash, changed],
  );
  await expect(publish(changedHash)).rejects.toThrow();
  expect(
    (
      await fixture.db.query(
        "select protocol from public.quiz_catalog_releases",
      )
    ).rows,
  ).toEqual([{ protocol: 1 }]);
});
it("sperrt Veröffentlichung und Zwischenstände für anonyme und angemeldete Clients", async () => {
  for (const role of ["anon", "authenticated"]) {
    await fixture.db.exec(`set role ${role}`);
    try {
      await expect(
        fixture.db.query("select quiz_sync_internal.publish_catalog($1)", [
          "a".repeat(64),
        ]),
      ).rejects.toThrow();
      await expect(
        fixture.db.query(
          "select * from quiz_sync_internal.catalog_publication_parts",
        ),
      ).rejects.toThrow();
    } finally {
      await fixture.db.exec("reset role");
    }
  }
});
