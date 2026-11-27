import type { Character, Part, Slot } from '../types';
import { getPart, partsForSlot } from './registry';

export const CUSTOM_PREFIX = 'custom/';
export const CUSTOM_ID_RE = /^custom\/[a-z0-9][a-z0-9-]{0,47}$/;
export const MAX_CUSTOM_PARTS = 40;

type WithCustom = Pick<Character, 'customParts'>;

/** bundled part, or one the character uploaded */
export function findPart(character: WithCustom, id: string): Part | undefined {
  if (!id.startsWith(CUSTOM_PREFIX)) return getPart(id);
  return character.customParts?.find((p) => p.id === id);
}

/** bundled parts first, then uploads */
export function partsFor(character: WithCustom, slot: Slot): Part[] {
  return [...partsForSlot(slot), ...(character.customParts ?? []).filter((p) => p.slot === slot)];
}

/** "My Hat (2).svg" -> label "My Hat (2)", id "custom/my-hat-2", unique */
export function customPartIdentity(
  fileName: string,
  taken: readonly Part[] = [],
): { id: string; label: string } {
  const label = fileName
    .replace(/\.svg$/i, '')
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ')
    .trim()
    .slice(0, 40);
  const slug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'part';
  const ids = new Set(taken.map((p) => p.id));
  let id = `${CUSTOM_PREFIX}${slug}`;
  for (let n = 2; ids.has(id); n++) id = `${CUSTOM_PREFIX}${slug}-${n}`;
  return { id, label: label || 'Custom part' };
}
