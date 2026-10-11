import { requestWithin, RequestTimeout } from "./request";

type RankingCacheKey = {
  client: object;
  owner?: string;
  key: string;
  fresh?: boolean;
};
const cache = new WeakMap<
  object,
  Map<string, { expires: number; promise: Promise<unknown> }>
>();
export function invalidateRankingCache(client: object, owner: string) {
  const entries = cache.get(client);
  if (entries)
    for (const key of entries.keys())
      if (key.startsWith(owner + ":")) entries.delete(key);
}
/** Bound UI loading even if the network or session refresh never settles. */
export async function rankingRequest<T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  controller: AbortController,
  context?: RankingCacheKey,
): Promise<T> {
  try {
    if (context) {
      let entries = cache.get(context.client);
      if (!entries) {
        entries = new Map();
        cache.set(context.client, entries);
      }
      const key = (context.owner ?? "guest") + ":" + context.key;
      let entry = entries.get(key);
      if (context.fresh || !entry || entry.expires <= Date.now()) {
        const promise = rankingRequest(request, new AbortController());
        entry = { expires: Date.now() + 30000, promise };
        entries.set(key, entry);
        if (entries.size > 80) entries.delete(entries.keys().next().value!);
        promise.then(
          (value) => {
            if (
              value &&
              typeof value === "object" &&
              "error" in value &&
              value.error &&
              entries!.get(key)?.promise === promise
            )
              entries!.delete(key);
          },
          () => {
            if (entries!.get(key)?.promise === promise) entries!.delete(key);
          },
        );
      }
      // Cancelling one page must not cancel another subscriber's shared RPC.
      return await requestWithin(
        () => entry!.promise as Promise<T>,
        10000,
        controller,
      );
    }
    return await requestWithin(request, 10_000, controller);
  } catch (error) {
    if (error instanceof RequestTimeout) throw new RankingTimeout();
    throw error;
  }
}
export class RankingTimeout extends Error {
  constructor() {
    super("Ranking request timed out");
  }
}
