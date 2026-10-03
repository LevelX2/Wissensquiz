import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
let catalogHash = "";
try { catalogHash = JSON.parse(readFileSync("tmp-sync/catalog/release.json", "utf8")).hash; } catch { /* Dev uses the actual importer until operator preparation. */ }
export default defineConfig({ plugins: [react()], define: { __OFFICIAL_CATALOG_HASH__: JSON.stringify(catalogHash) } });
