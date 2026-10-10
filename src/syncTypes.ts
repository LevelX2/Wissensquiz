export type SyncStatus =
  "loading" | "saved" | "saving" | "offline" | "conflict";
export type WriteOptions = {
  progressOnly?: boolean;
  replace?: boolean;
  reuseCatalog?: boolean;
};
