import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requestWithin } from "./request";
import { CloudConflict, CloudSaveError } from "./accounts";
import {
  cachedRelease,
  rememberRelease,
  objectHashes,
  releaseHashes,
} from "./entryStorage";
import {
  verifyRelease,
  verifyObject,
  rowKey,
  type PreparedRelease,
  type SyncDocument,
  type SyncObject,
} from "./syncCodec";

export const metadataSchema = z.object({
  protocol: z.literal(1),
  generation: z.string().uuid().nullable(),
  revision: z.number().int().nonnegative(),
  cursorFloor: z.number().int().nonnegative(),
  paused: z.boolean().optional(),
});
export type SyncMetadata = z.infer<typeof metadataSchema>;
export type SyncConfirmation = {
  id: string;
  generation: string;
  revision: number;
  confirmedAt: number;
};
export class MissingSyncProtocol extends Error {}
export class DownloadChanged extends Error {}
export class CursorExpired extends Error {}
export interface SyncRemote {
  call<T>(
    name: string,
    args: Record<string, unknown>,
    timeout?: number,
  ): Promise<T>;
  stop(): void;
}
export class SupabaseEntryRemote implements SyncRemote {
  private controllers = new Set<AbortController>();
  constructor(
    private client: SupabaseClient,
    private lifecycle?: AbortSignal,
  ) {}
  stop() {
    for (const controller of this.controllers) controller.abort();
  }
  async call<T>(
    name: string,
    args: Record<string, unknown>,
    timeout = 10_000,
  ): Promise<T> {
    const controller = new AbortController(),
      abort = () => controller.abort();
    if (this.lifecycle?.aborted) controller.abort();
    this.lifecycle?.addEventListener("abort", abort, { once: true });
    this.controllers.add(controller);
    try {
      return await requestWithin(
        async (signal) => {
          const { data, error, status } = await this.client
            .rpc(name, args)
            .abortSignal(signal);
          if (error) {
            if (error.code === "PGRST202" || error.code === "42883")
              throw new MissingSyncProtocol();
            if (/revision_conflict|generation_mismatch/.test(error.message))
              throw new CloudConflict();
            if (error.message.includes("download_changed"))
              throw new DownloadChanged();
            if (error.message.includes("cursor_expired"))
              throw new CursorExpired();
            throw new CloudSaveError(
              status === 401 || status === 403
                ? "Der Kontodienst hat den Zugriff abgelehnt. Prüfe Deine Anmeldung im Profil."
                : "Die Online-Speicherung konnte nicht bestätigt werden. Deine Änderungen bleiben lokal erhalten.",
            );
          }
          return data as T;
        },
        timeout,
        controller,
      );
    } finally {
      this.controllers.delete(controller);
      this.lifecycle?.removeEventListener("abort", abort);
    }
  }
}
export async function getMetadata(api: SyncRemote, owner: string) {
  return metadataSchema.parse(
    await api.call("quiz_sync_metadata", { expected_owner: owner }),
  );
}
export async function getRelease(
  api: SyncRemote,
  hash: string,
): Promise<PreparedRelease> {
  const existing = await cachedRelease(hash);
  if (existing) return existing;
  const release = await verifyRelease(
    await api.call("quiz_sync_catalog", { catalog_hash: hash }, 30_000),
  );
  if (release.hash !== hash)
    throw new Error("Der geladene Katalog passt nicht zum Verweis.");
  await rememberRelease(release);
  return release;
}
const incomingRow = z.object({
  kind: z.enum(["field", "round", "event", "learning", "record"]),
  id: z.string().min(1).max(8192),
  position: z.number().int().min(0).max(1000000),
  value: z.unknown(),
  deleted: z.boolean(),
});
const pageSchema = z.object({
  generation: z.string().uuid(),
  revision: z.number().int().nonnegative(),
  rows: z.array(incomingRow).max(500),
  nextCursor: z.string().nullable(),
  done: z.boolean(),
});
const objectSchema = z.object({
  hash: z.string().regex(/^[0-9a-f]{64}$/),
  encoding: z.enum(["questions-field-refs-v1", "json-v1"]),
  text: z.string().nullable(),
  characters: z.number().int().nonnegative(),
});
export async function downloadDocument(
  api: SyncRemote,
  owner: string,
  generation: string,
  revision: number,
  afterRevision = -1,
  previous?: SyncDocument,
) {
  const document: SyncDocument = {
    rows: new Map(previous?.rows),
    objects: new Map(previous?.objects),
  };
  let cursor = "",
    pages = 0;
  while (true) {
    if (++pages > 10000) throw new Error("Der Abruf ist zu groß.");
    const page = pageSchema.parse(
      await api.call(
        "quiz_sync_page",
        {
          expected_owner: owner,
          target_generation: generation,
          expected_revision: revision,
          after_revision: afterRevision,
          page_cursor: cursor,
          page_size: 200,
        },
        30_000,
      ),
    );
    if (page.generation !== generation || page.revision !== revision)
      throw new DownloadChanged();
    for (const row of page.rows) {
      const key = rowKey(row.kind, row.id);
      if (row.deleted) document.rows.delete(key);
      else {
        const { deleted: _, ...entry } = row;
        document.rows.set(key, entry);
      }
    }
    if (page.done) break;
    if (!page.nextCursor || page.nextCursor === cursor)
      throw new Error("Der Abrufcursor ist ungültig.");
    cursor = page.nextCursor;
  }
  const catalogs = await Promise.all(
    [...releaseHashes(document)].map((hash) => getRelease(api, hash)),
  );
  const missing = [...objectHashes(document)].filter(
    (hash) => !document.objects.has(hash),
  );
  for (let at = 0; at < missing.length; at += 100) {
    const objects = z.array(objectSchema).parse(
      await api.call(
        "quiz_sync_objects",
        {
          expected_owner: owner,
          target_generation: generation,
          object_hashes: missing.slice(at, at + 100),
        },
        30_000,
      ),
    );
    for (const item of objects) {
      let text = item.text ?? "";
      if (item.text === null) {
        let offset = 0,
          bytes = 0;
        while (true) {
          const part = z
            .object({
              hash: z.string(),
              encoding: z.string(),
              text: z.string(),
              nextOffset: z.number().int().nonnegative(),
              done: z.boolean(),
            })
            .parse(
              await api.call(
                "quiz_sync_object_read",
                {
                  expected_owner: owner,
                  target_generation: generation,
                  object_hash: item.hash,
                  part_offset: offset,
                },
                30_000,
              ),
            );
          if (
            part.hash !== item.hash ||
            part.encoding !== item.encoding ||
            (part.nextOffset <= offset && !part.done)
          )
            throw new Error("Der Inhaltsabruf ist ungültig.");
          text += part.text;
          offset = part.nextOffset;
          bytes += new TextEncoder().encode(part.text).byteLength;
          if (bytes > 64 * 1024 * 1024)
            throw new Error("Das Objekt ist zu groß.");
          if (part.done) break;
        }
      }
      const object: SyncObject = {
        hash: item.hash,
        encoding: item.encoding,
        text,
      };
      await verifyObject(object);
      document.objects.set(object.hash, object);
    }
  }
  for (const hash of missing)
    if (!document.objects.has(hash))
      throw new Error("Ein privater Inhalt fehlt.");
  return { document, catalogs };
}
// UTF-8 bounded pieces; preserve surrogate pairs at boundaries. The server uses
// character offsets only for downloads and never truncates stored object data.
export async function uploadObject(
  api: SyncRemote,
  owner: string,
  generation: string,
  object: SyncObject,
) {
  const pieces = [];
  let at = 0;
  while (at < object.text.length) {
    let end = Math.min(at + 32768, object.text.length);
    if (
      end < object.text.length &&
      /[\uD800-\uDBFF]/.test(object.text[end - 1])
    )
      end--;
    pieces.push(object.text.slice(at, end));
    at = end;
  }
  if (!pieces.length) pieces.push("");
  for (let part = 0; part < pieces.length; part++)
    await api.call(
      "quiz_sync_object_piece",
      {
        expected_owner: owner,
        target_generation: generation,
        object_hash: object.hash,
        object_encoding: object.encoding,
        part_index: part,
        part_count: pieces.length,
        part_content: pieces[part],
      },
      30_000,
    );
}
