import { isShareHash } from '../export/shareLink';

// Takes the character out of the address as soon as this loads, before any script after
// it can read it. The analytics tag only sends the path today; this keeps it that way.

let pending: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function captureShareLink(): void {
  const { hash, pathname, search } = window.location;
  if (!isShareHash(hash)) return;
  pending = hash;
  // also means a reload doesn't ask again
  window.history.replaceState(window.history.state, '', pathname + search);
  notify();
}

export const pendingShareHash = (): string | null => pending;

export function dismissShareLink(): void {
  pending = null;
  notify();
}

export function subscribeShareLink(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// pasting a link into an open tab only changes the hash
window.addEventListener('popstate', captureShareLink);
window.addEventListener('hashchange', captureShareLink);
captureShareLink();
