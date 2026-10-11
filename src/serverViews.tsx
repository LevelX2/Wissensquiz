import { createContext, useContext, useEffect, useState } from "react";
import { z } from "zod";
import type { SyncRemote } from "./entryRemote";
import type { learningOverview } from "./learningProgress";
import type { learningPathProgress } from "./learningPath";
export const contentInfoSchema = z.object({
  hash: z.string(),
  questions: z.number().int(),
  goals: z.number().int(),
  genres: z.array(z.string()),
  areas: z.number().int(),
});
export type ContentInfo = z.infer<typeof contentInfoSchema>;
export type LearningOverview = ReturnType<typeof learningOverview>;
export type Journey = Record<
  string,
  ReturnType<ReturnType<typeof learningPathProgress>>
>;
export type SelectionView = {
  poolSize: number;
  selectionSize: number;
  repetitions: { due: number; later: number; nextAt: number | null };
  journey: Journey;
};
export type TopicSummary = {
  topic: string;
  genres: string[];
  goals: number;
  learning: LearningOverview;
};
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
function readView<T>(
  api: SyncRemote,
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
    return old.promise as Promise<T>;
  const promise = api.call<T>("quiz_game_view", { request_text: key });
  cache.set(id, { expires: Date.now() + 30000, promise });
  if (cache.size > 40) cache.delete(cache.keys().next().value!);
  promise.catch(() => {
    if (cache!.get(id)?.promise === promise) cache!.delete(id);
  });
  return promise;
}
export function useServerView<T>(request: object | null) {
  const server = useServer(),
    key = JSON.stringify(request);
  const [result, setResult] = useState<{
      key: string;
      revision: number;
      value: T;
    }>(),
    [error, setError] = useState(""),
    [attempt, retry] = useState(0);
  useEffect(() => {
    if (!server || !request) return;
    let alive = true;
    setError("");
    readView<T>(server.api, key, server.revision, attempt > 0)
      .then((value) => {
        if (alive) setResult({ key, revision: server.revision, value });
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
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
    retry: () => retry((n) => n + 1),
  };
}
