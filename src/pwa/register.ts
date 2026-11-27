/** offline support, only in the built app so dev never serves stale files */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    // the app works fine without it, so a failure is ignored
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
