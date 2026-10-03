import { emptyState } from "./model";
import { packages, addPackages } from "./packages";
import { prepareRelease, type PreparedRelease } from "./syncCodec";
import { requestWithin } from "./request";

let prepared: Promise<PreparedRelease> | undefined;
declare const __OFFICIAL_CATALOG_HASH__: string;
export function loadOfficialCatalog(
  lookup?: (hash: string) => Promise<PreparedRelease>,
): Promise<PreparedRelease> {
  if (
    lookup &&
    typeof __OFFICIAL_CATALOG_HASH__ !== "undefined" &&
    __OFFICIAL_CATALOG_HASH__
  )
    return lookup(__OFFICIAL_CATALOG_HASH__);
  return (prepared ??= requestWithin(async (signal) => {
    const contents = await Promise.all(
      packages.map(async (pkg) => {
        const response = await fetch(pkg.path, { signal });
        if (!response.ok)
          throw new Error("Der vollständige offizielle Katalog fehlt.");
        return { filename: pkg.filename, text: await response.text() };
      }),
    );
    const state = emptyState();
    // Exactly the App importer: category/fact generation and actor goal links.
    addPackages(state, contents);
    return prepareRelease(state.questions);
  }, 30_000).catch((error) => {
    prepared = undefined;
    throw error;
  }));
}
