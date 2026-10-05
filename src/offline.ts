import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { requestWithin } from "./request";

const OfflineContext = createContext<ReturnType<typeof useOfflineState> | null>(
  null,
);
class UpdateBlocked extends Error {}
function useOfflineState() {
  const [online, setOnline] = useState(navigator.onLine);
  const [ready, setReady] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const registration = useRef<Promise<ServiceWorkerRegistration> | null>(null);
  const action = useRef(false);
  useEffect(() => {
    let current: ServiceWorkerRegistration | undefined;
    let lastCheck = Date.now();
    const cleanups = new Set<() => void>();
    const network = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) refresh();
    };
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    let alive = true;
    const check = () => {
      if (!alive || !navigator.serviceWorker?.controller) return;
      const channel = new MessageChannel();
      const close = () => {
        clearTimeout(timer);
        channel.port1.close();
        cleanups.delete(close);
      };
      const timer = window.setTimeout(close, 5000);
      cleanups.add(close);
      channel.port1.onmessage = (e) => {
        if (alive) setReady(e.data.ready === true);
        close();
      };
      navigator.serviceWorker.controller.postMessage("PACKAGE_STATUS", [
        channel.port2,
      ]);
    };
    const refresh = () => {
      check();
      if (current && navigator.onLine && Date.now() - lastCheck >= 60_000) {
        lastCheck = Date.now();
        void current.update().catch(() => {});
      }
    };
    const visibility = () => {
      if (!document.hidden) refresh();
    };
    if (
      window.isSecureContext &&
      "serviceWorker" in navigator &&
      import.meta.env.PROD
    ) {
      navigator.serviceWorker.addEventListener("controllerchange", check);
      document.addEventListener("visibilitychange", visibility);
      registration.current = navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((r) => {
          if (!alive) return r;
          current = r;
          const track = () => {
            if (!alive) return;
            setWaiting(!!r.waiting);
            const worker = r.installing;
            if (!worker) return;
            const changed = () => {
              if (alive) setWaiting(!!r.waiting);
            };
            worker.addEventListener("statechange", changed);
            cleanups.add(() =>
              worker.removeEventListener("statechange", changed),
            );
          };
          track();
          r.addEventListener("updatefound", track);
          cleanups.add(() => r.removeEventListener("updatefound", track));
          void navigator.serviceWorker.ready.then(check);
          return r;
        });
      void registration.current.catch(() => {
        if (alive) setReady(false);
      });
    }
    return () => {
      alive = false;
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      navigator.serviceWorker?.removeEventListener("controllerchange", check);
      document.removeEventListener("visibilitychange", visibility);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);
  const checkForUpdate = useCallback(async () => {
    if (action.current) return;
    action.current = true;
    setChecking(true);
    setUpdateMessage("");
    try {
      await requestWithin(async (signal) => {
        const current = await registration.current;
        if (!current) throw new Error();
        await current.update();
        const worker = current.installing;
        if (worker)
          await new Promise<void>((resolve, reject) => {
            const cleanup = () => {
              worker.removeEventListener("statechange", changed);
              signal.removeEventListener("abort", aborted);
            };
            const changed = () => {
              if (
                ["installed", "activated", "redundant"].includes(worker.state)
              ) {
                cleanup();
                worker.state === "redundant" ? reject(new Error()) : resolve();
              }
            };
            const aborted = () => {
              cleanup();
              reject(signal.reason);
            };
            worker.addEventListener("statechange", changed);
            signal.addEventListener("abort", aborted, { once: true });
            if (signal.aborted) aborted();
            else changed();
          });
        if (signal.aborted) throw signal.reason;
        setWaiting(!!current.waiting);
        setUpdateMessage(
          current.waiting
            ? "Die neue Quiz-Version ist bereit."
            : "Es ist kein neues Update verfügbar.",
        );
      }, 30_000);
    } catch {
      setUpdateMessage(
        "Die Update-Prüfung konnte nicht abgeschlossen werden. Versuche es mit Internetverbindung erneut.",
      );
    } finally {
      action.current = false;
      setChecking(false);
    }
  }, []);
  const activateUpdate = useCallback(async () => {
    if (action.current) return;
    action.current = true;
    setUpdating(true);
    setUpdateMessage("");
    try {
      await requestWithin(async (signal) => {
        const current = await registration.current;
        if (!current?.waiting)
          throw new UpdateBlocked(
            "Das Update ist noch nicht bereit. Suche erneut nach einer neuen Quiz-Version.",
          );
        await new Promise<void>((resolve, reject) => {
          const channel = new MessageChannel();
          const cleanup = () => {
            channel.port1.close();
            navigator.serviceWorker.removeEventListener(
              "controllerchange",
              changed,
            );
            signal.removeEventListener("abort", aborted);
          };
          const changed = () => {
            cleanup();
            resolve();
          };
          const aborted = () => {
            cleanup();
            reject(signal.reason);
          };
          navigator.serviceWorker.addEventListener("controllerchange", changed);
          signal.addEventListener("abort", aborted, { once: true });
          channel.port1.onmessage = (event) => {
            if (event.data?.reason === "other-windows") {
              cleanup();
              reject(
                new UpdateBlocked(
                  "Schließe die anderen Quiz-Tabs und Quiz-App-Fenster. Klicke danach hier erneut auf „Quiz aktualisieren“.",
                ),
              );
            }
          };
          if (signal.aborted) aborted();
          else current.waiting!.postMessage("ACTIVATE_UPDATE", [channel.port2]);
        });
      }, 15_000);
      location.reload();
    } catch (error) {
      setUpdateMessage(
        error instanceof UpdateBlocked
          ? error.message
          : "Das Update konnte nicht geöffnet werden. Schließe alle Quiz-Fenster und öffne das Quiz erneut.",
      );
      setUpdating(false);
    } finally {
      action.current = false;
    }
  }, []);
  return {
    online,
    ready,
    waiting,
    supported: window.isSecureContext && "serviceWorker" in navigator,
    checking,
    updating,
    updateMessage,
    checkForUpdate,
    activateUpdate,
  };
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const value = useOfflineState();
  return createElement(
    OfflineContext.Provider,
    { value },
    createElement(
      "div",
      { inert: value.updating, hidden: value.updating },
      children,
    ),
    value.updating
      ? createElement(
          "main",
          { className: "account-page", role: "status" },
          "Quiz wird aktualisiert … Dein gespeicherter Fortschritt bleibt erhalten.",
        )
      : null,
  );
}
export function useOffline() {
  const value = useContext(OfflineContext);
  if (!value) throw new Error("OfflineProvider fehlt.");
  return value;
}
