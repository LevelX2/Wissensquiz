// Remove the previously installed quiz worker and its static offline packages.
// New app versions do not register a worker. This URL lets existing installations
// retire themselves without reloading a running game or touching personal saves.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("film-"))
          .map((name) => caches.delete(name)),
      );
      await self.registration.unregister();
    })(),
  );
});
