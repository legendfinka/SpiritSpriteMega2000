import { toImageTag } from '../export/fileNames';
import type { Character } from '../types';
import { createDefaultCharacter } from './defaultCharacter';
import { parseCharacter } from './parseCharacter';

export const MAX_CAST = 24;

/** a character in the cast; the id is only for the app, it never gets exported */
export interface CastMember {
  id: string;
  character: Character;
}

let counter = 0;
export function newMemberId(): string {
  return `m${Date.now().toString(36)}${(counter++).toString(36)}`;
}

/** "guy" -> "guy 2" if a cast member already uses that tag, since files would clash */
export function uniqueCharacterName(name: string, cast: readonly CastMember[]): string {
  const taken = new Set(cast.map((m) => toImageTag(m.character.name)));
  const base = name.trim().replace(/\s+\d+$/, '') || 'character';
  if (!taken.has(toImageTag(base))) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} ${n}`;
    if (!taken.has(toImageTag(candidate))) return candidate;
  }
}

export interface CastState {
  /** the selected character; the single source of truth while it's selected */
  character: Character;
  /** everyone, in order; the selected member's copy can be stale, use `character` */
  cast: CastMember[];
  activeId: string;
}

export function freshCast(): CastState {
  const member = { id: newMemberId(), character: createDefaultCharacter() };
  return { character: member.character, cast: [member], activeId: member.id };
}

/** the cast with the selected member up to date */
export function castWithActive({ character, cast, activeId }: CastState): CastMember[] {
  return cast.map((m) => (m.id === activeId ? { ...m, character } : m));
}

/** saved data, old single-character saves included; null if nothing usable */
export function restoreCast(saved: unknown): CastState | null {
  const { cast, activeId, character } = (saved ?? {}) as Record<string, unknown>;
  if (Array.isArray(cast)) {
    const members: CastMember[] = [];
    for (const item of cast.slice(0, MAX_CAST)) {
      const { id, character: c } = (item ?? {}) as Record<string, unknown>;
      const parsed = parseCharacter(c);
      if (typeof id === 'string' && parsed && !members.some((m) => m.id === id)) {
        members.push({ id, character: parsed });
      }
    }
    const active = members.find((m) => m.id === activeId) ?? members[0];
    if (active) return { cast: members, activeId: active.id, character: active.character };
  }
  // saves from before the cast existed held one character
  const single = parseCharacter(character);
  if (!single) return null;
  const member = { id: newMemberId(), character: single };
  return { cast: [member], activeId: member.id, character: single };
}
