import { requestWithin, RequestTimeout } from "./request";

/** Bound UI loading even if the network or session refresh never settles. */
export async function rankingRequest<T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  controller: AbortController,
) {
  try {
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
