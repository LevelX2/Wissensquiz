import { useEffect, useState } from "react";

// A preview belongs to the visible start page. Recompute after sleep/tab return
// and while it stays open, without freezing learning due dates in a memo.
export function useForegroundTime() {
  const [, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "hidden") setNow(Date.now());
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(timer);
    };
  }, []);
  return Date.now();
}
