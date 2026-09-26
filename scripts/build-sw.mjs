import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = (await readdir("dist", { recursive: true })).filter(
  (x) => /\.(js|css|html|svg|png|webmanifest|csv)$/.test(x) && x !== "sw.js",
);
const hash = createHash("sha256");
for (const f of files) hash.update(await readFile(`dist/${f}`));
const version = `film-${hash.digest("hex").slice(0, 12)}`;
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(version)}; const FILES=${JSON.stringify(["/", ...files.map((f) => "/" + f.replaceAll("\\", "/"))])};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
// No skipWaiting: an update activates only after all old app windows are closed.
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('film-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// These same-origin static assets are identical for every Origin header. Vite's
// Vary: Origin must not prevent module-script requests from matching the precache.
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return; e.respondWith(caches.open(CACHE).then(async c=> (await c.match(e.request,{ignoreVary:true})) || (e.request.mode==='navigate' ? await c.match('/') : null) || fetch(e.request))); });
self.addEventListener('message',e=>{if(e.data==='PACKAGE_STATUS') e.waitUntil(caches.open(CACHE).then(async c=>{const ready=(await Promise.all(FILES.map(f=>c.match(f)))).every(Boolean);e.ports[0]?.postMessage({ready,version:CACHE});}));});`,
);
console.log(`Offline-Paket: ${version}, ${files.length} Dateien`);
