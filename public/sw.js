const CACHE_NAME = "pokedex-kanto-v2";
let forceOffline = false;
const SPRITE_URLS = Array.from({ length: 151 }, (_, index) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`,
);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add("/").catch(() => {});
    await cache.add("/favicon.svg").catch(() => {});
    for (let index = 0; index < SPRITE_URLS.length; index += 16) {
      await Promise.all(SPRITE_URLS.slice(index, index + 16).map((url) => cache.add(url).catch(() => {})));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("pokedex-kanto-") && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "pokedex-offline-mode") {
    forceOffline = Boolean(event.data.enabled);
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSprite = url.hostname === "raw.githubusercontent.com" && url.pathname.includes("/sprites/pokemon/");
  const isLocalAsset = url.origin === self.location.origin && ["script", "style", "font", "image"].includes(request.destination);

  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put("/", response.clone());
        return response;
      } catch {
        return await cache.match(request) ?? await cache.match("/");
      }
    })());
    return;
  }

  if (!isSprite && !isLocalAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (forceOffline && isSprite) {
      const id = url.pathname.match(/\/(\d+)\.(?:png|gif)$/)?.[1];
      const fallback = id
        ? await cache.match(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`)
        : undefined;
      if (fallback) return fallback;
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
        { headers: { "content-type": "image/svg+xml" } },
      );
    }
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
