// used by vite.config.ts to write dist/sw.js at build time

/** files from public/, which the bundler doesn't list; a test keeps this complete */
export const PUBLIC_FILES: readonly string[] = [
  'manifest.webmanifest',
  'favicon.svg',
  'logo.svg',
  'templates/alignment-guide.svg',
  'backgrounds/classroom.svg',
  'backgrounds/courtyard.svg',
  'backgrounds/kitchen.svg',
  'backgrounds/rooftop.svg',
  'backgrounds/room.svg',
];

export const CACHE_PREFIX = 'spirit-sprite-';

/**
 * Precaches the whole app. Pages: network first, so a new deploy shows up at once.
 * Everything else: cache first (hashed names, and each build gets a fresh cache).
 * Other sites (analytics) are left alone.
 */
export function serviceWorkerSource(files: readonly string[], version: string): string {
  return `// generated at build time
const CACHE = ${JSON.stringify(CACHE_PREFIX + version)};
const FILES = ${JSON.stringify(['./', ...files.map((f) => `./${f}`)])};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(${JSON.stringify(CACHE_PREFIX)}) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // ignoreVary: scripts and styles load with an Origin header the precache didn't send,
  // so a "Vary: Origin" response would otherwise never match and offline stays blank
  const cached = (key) =>
    caches.open(CACHE).then((cache) => cache.match(key, { ignoreVary: true }));
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => cached('./').then((page) => page || Response.error())),
    );
    return;
  }
  event.respondWith(cached(request).then((hit) => hit || fetch(request)));
});
`;
}
