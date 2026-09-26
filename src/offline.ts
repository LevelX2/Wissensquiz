import { useEffect, useState } from "react";
export function useOffline() {
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);
  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    let alive = true;
    let registration: ServiceWorkerRegistration | undefined;
    const check = () => {
      if (!navigator.serviceWorker?.controller) return;
      const channel = new MessageChannel();
      channel.port1.onmessage = (e) => {
        if (alive) setReady(e.data.ready === true);
        channel.port1.close();
      };
      navigator.serviceWorker.controller.postMessage("PACKAGE_STATUS", [
        channel.port2,
      ]);
    };
    const visibility = () => {
      if (!document.hidden) check();
    };
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.addEventListener("controllerchange", check);
      document.addEventListener("visibilitychange", visibility);
      navigator.serviceWorker
        .register("/sw.js")
        .then((r) => {
          registration = r;
          if (alive) setWaiting(!!r.waiting);
          r.addEventListener("updatefound", () =>
            r.installing?.addEventListener("statechange", () => {
              if (alive) setWaiting(!!r.waiting);
            }),
          );
          return navigator.serviceWorker.ready;
        })
        .then(check)
        .catch(() => {
          if (alive) setReady(false);
        });
    }
    return () => {
      alive = false;
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      navigator.serviceWorker?.removeEventListener("controllerchange", check);
      document.removeEventListener("visibilitychange", visibility);
      void registration;
    };
  }, []);
  return {
    online,
    ready,
    waiting,
    supported: window.isSecureContext && "serviceWorker" in navigator,
  };
}
