import { useContext, useEffect, useState } from "react";
import { z } from "zod";
import { ActivityContext } from "./GuestActivity";
import { rankingRequest } from "./rankingRequest";

const version = Number(import.meta.env.VITE_SITE_VERSION ?? 0);
const key = `wissensquiz-release-${version}`;
const releaseSchema = z.object({
  version: z.number().int().positive(),
  published_at: z.iso.datetime({ offset: true }),
});
type Release = z.infer<typeof releaseSchema>;
function cachedRelease(): Release | null {
  try {
    const value = releaseSchema.safeParse(
      JSON.parse(localStorage.getItem(key) ?? "null"),
    );
    return value.success && value.data.version === version ? value.data : null;
  } catch {
    return null;
  }
}
export function ReleaseInfo() {
  const client = useContext(ActivityContext);
  const [release, setRelease] = useState(cachedRelease);
  useEffect(() => {
    if (!client || !Number.isInteger(version) || version < 1) return;
    const controller = new AbortController();
    void rankingRequest(
      (signal) =>
        client
          .rpc("quiz_app_release", { selected_version: version })
          .abortSignal(signal),
      controller,
    )
      .then(({ data, error }) => {
        if (controller.signal.aborted || error) return;
        const result = z.array(releaseSchema).max(1).safeParse(data);
        const current = result.success ? result.data[0] : undefined;
        if (!current || current.version !== version) return;
        setRelease(current);
        try {
          localStorage.setItem(key, JSON.stringify(current));
        } catch {
          // Version information never blocks playing or saving progress.
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [client]);
  return (
    <p className="release-info" aria-label="Version und Veröffentlichung">
      <strong>
        {version > 0 ? `Version ${version}` : "Lokale Entwicklungsversion"}
      </strong>
      {version > 0 && (
        <span>
          {release ? (
            <>
              Veröffentlicht am{" "}
              <time dateTime={release.published_at}>
                {new Date(release.published_at).toLocaleString("de-DE", {
                  timeZone: "Europe/Berlin",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" Uhr · deutsche Zeit"}
              </time>
            </>
          ) : (
            "Veröffentlichungszeit derzeit nicht verfügbar."
          )}
        </span>
      )}
    </p>
  );
}
