import { useRef, useState } from "react";

// The synchronous lock also covers a second click before React has rendered
// the disabled controls. A retry retains the original operation and intent.
export function useAsyncAction(
  onBusy: (busy: boolean) => void,
  onError?: (error: unknown) => Promise<string | void>,
) {
  const locked = useRef(false);
  const failedWork = useRef<(() => Promise<unknown>) | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, render] = useState(0);
  const work = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    if (locked.current) return null;
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    failedWork.current = undefined;
    try {
      const result = await fn();
      render((n) => n + 1);
      return result;
    } catch (e) {
      failedWork.current = fn;
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      const detail = await onError?.(e);
      if (detail) setError(detail);
      return null;
    } finally {
      locked.current = false;
      setBusy(false);
      onBusy(false);
    }
  };
  return { work, busy, error, failedWork };
}
