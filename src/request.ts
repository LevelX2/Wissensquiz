export class RequestTimeout extends Error {
  constructor() {
    super("Die Anfrage hat nicht rechtzeitig geantwortet.");
  }
}

// The deadline also covers session refreshes that do not react to AbortSignal.
export async function requestWithin<T>(
  request: (signal: AbortSignal) => PromiseLike<T>,
  timeoutMs = 10_000,
  controller = new AbortController(),
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void = () => {};
  try {
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () =>
        reject(
          controller.signal.reason ??
            new DOMException("Abgebrochen", "AbortError"),
        );
      controller.signal.addEventListener("abort", onAbort, { once: true });
      if (controller.signal.aborted) onAbort();
      else
        timer = setTimeout(
          () => controller.abort(new RequestTimeout()),
          timeoutMs,
        );
    });
    return await Promise.race([
      Promise.resolve().then(() => {
        if (controller.signal.aborted) throw controller.signal.reason;
        return request(controller.signal);
      }),
      aborted,
    ]);
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener("abort", onAbort);
  }
}
