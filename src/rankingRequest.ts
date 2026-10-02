/** Bound UI loading even if the network or session refresh never settles. */
export async function rankingRequest<T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  controller: AbortController,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => request(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new RankingTimeout());
        }, 10_000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export class RankingTimeout extends Error {
  constructor() {
    super("Ranking request timed out");
  }
}
