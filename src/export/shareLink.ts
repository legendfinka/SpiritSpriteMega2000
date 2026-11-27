import type { Character } from '../types';
import { characterFromJson } from './characterJson';

const PREFIX = '#c=';
// room for a few uploaded parts; browsers handle URLs far longer
const MAX_LENGTH = 1_000_000;

/** the whole character, packed into the hash so it never reaches a server */
export function shareHash(character: Character): string {
  const bytes = new TextEncoder().encode(JSON.stringify(character));
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return PREFIX + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function shareUrl(character: Character, location: Pick<Location, 'origin' | 'pathname'>): string {
  return `${location.origin}${location.pathname}${shareHash(character)}`;
}

export function isShareHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}

/** null if the link is broken or isn't a character */
export function characterFromHash(hash: string): Character | null {
  if (!isShareHash(hash) || hash.length > MAX_LENGTH) return null;
  try {
    const binary = atob(hash.slice(PREFIX.length).replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return characterFromJson(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
