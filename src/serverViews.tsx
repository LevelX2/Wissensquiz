import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { SyncRemote } from "./entryRemote";
import {
  parseServerView,
  type ContentInfo,
  type ViewAction,
  type ViewRequest,
  type ViewResult,
} from "./serverViewSchemas";
export { contentInfoSchema } from "./serverViewSchemas";
export type {
  ContentInfo,
  LearningOverview,
  Journey,
  SelectionView,
  TopicSummary,
} from "./serverViewSchemas";
export const ServerContext = createContext<{
  api: SyncRemote;
  info: ContentInfo;
  revision: number;
  exportState: () => Promise<import("./model").State>;
} | null>(null);
export const useServer = () => useContext(ServerContext);
// Per account connection, RAM only: coalesce simultaneous requests and reuse
// unchanged views briefly. A revision change invalidates private projections.
const views = new WeakMap<
  SyncRemote,
  Map<string, { expires: number; promise: Promise<unknown> }>
>();
export function readView<K extends ViewAction>(
  api: SyncRemote,
  action: K,
  key: string,
  revision: number,
  fresh = false,
) {
  let cache = views.get(api);
  if (!cache) {
    cache = new Map();
    views.set(api, cache);
  }
  const id = revision + ":" + key,
    old = cache.get(id);
  if (!fresh && old && old.expires > Date.now())
    return old.promise as Promise<ViewResult<K>>;
  const promise = api
    .call<unknown>("quiz_game_view", { request_text: key })
    .then((value) => parseServerView(action, value));
  cache.set(id, { expires: Date.now() + 30000, promise });
  if (cache.size > 40) cache.delete(cache.keys().next().value!);
  promise.catch(() => {
    if (cache!.get(id)?.promise === promise) cache!.delete(id);
  });
  return promise;
}
export function useServerView<K extends ViewAction>(
  request: ViewRequest<K> | null,
) {
  const server = useServer(),
    key = JSON.stringify(request);
  const pending = useRef(false);
  const [result, setResult] = useState<{
      key: string;
      revision: number;
      value: ViewResult<K>;
    }>(),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0);
  useEffect(() => {
    if (!server || !request) return;
    let alive = true;
    pending.current = true;
    setError("");
    readView(server.api, request.action, key, server.revision, attempt > 0)
      .then((value) => {
        if (alive) setResult({ key, revision: server.revision, value });
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) pending.current = false;
      });
    return () => {
      alive = false;
    };
  }, [server?.api, server?.revision, key, attempt]);
  return {
    value:
      result?.key === key && result.revision === server?.revision
        ? result.value
        : undefined,
    error,
    retry: () => {
      if (pending.current) return;
      pending.current = true;
      retry((n) => n + 1);
    },
  };
}
