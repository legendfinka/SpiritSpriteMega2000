import { describe, expect, it } from 'vitest';
import { PRESET_EXPRESSIONS } from '../expressions/presets';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { parseCharacter } from '../store/parseCharacter';
import { STARTERS } from '../store/starters';
import { COLOR_TOKENS } from '../types';
import { getPart, PARTS, partsForSlot, toFragment } from './registry';

describe('library size', () => {
  it.each([
    ['hairFront', 10],
    ['hairBack', 9],
    ['outfit', 12],
    ['body', 2],
    ['face', 4],
    ['eyes', 11],
    ['mouth', 12],
    ['brows', 8],
    ['extras', 9],
    ['accessory', 8],
  ] as const)('%s has at least %i parts', (slot, min) => {
    expect(partsForSlot(slot).length).toBeGreaterThanOrEqual(min);
  });
});

describe.each(STARTERS.map((s) => [s.label, s] as const))('starter %s', (_label, starter) => {
  it('uses existing parts in the right slots', () => {
    for (const [slot, id] of Object.entries(starter.create().parts)) {
      expect(getPart(id)?.slot, id).toBe(slot);
    }
  });

  it('is a valid character', () => {
    const character = starter.create();
    expect(parseCharacter(JSON.parse(JSON.stringify(character)))).toEqual(character);
  });
});

const KNOWN_TOKENS: readonly string[] = COLOR_TOKENS;
const ALLOWED_HEX = ['#fff', '#ffffff', '#000', '#000000'];

describe.each(PARTS.map((p) => [p.id, p] as const))('part %s', (_id, part) => {
  it('has a kebab-case id', () => {
    expect(part.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*\/[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('is a fragment, not a full <svg> document', () => {
    expect(part.svg).not.toMatch(/<svg[\s>]/i);
  });

  it('only uses known colour tokens', () => {
    const used = [...part.svg.matchAll(/var\(\s*--([a-z0-9-]+)\s*\)/gi)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const token of used) expect(KNOWN_TOKENS, `--${token}`).toContain(token);
  });

  it('has no hard-coded hex except pure black/white', () => {
    const hexes = part.svg.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    for (const hex of hexes) expect(ALLOWED_HEX, hex).toContain(hex.toLowerCase());
  });

  it('is well-formed XML', () => {
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${part.svg}</svg>`,
      'image/svg+xml',
    );
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  });
});

describe('toFragment', () => {
  it('strips the <svg> wrapper and fallback colours', () => {
    const file = '<svg viewBox="0 0 800 1080">\n<path fill="var(--hair, #6b4428)"/>\n</svg>\n';
    expect(toFragment(file)).toBe('<path fill="var(--hair)"/>');
  });

  it('rejects a file without a wrapper', () => {
    expect(() => toFragment('<path/>')).toThrow(/wrapper/);
  });
});

describe('references', () => {
  it('every preset expression points at existing parts', () => {
    for (const expr of Object.values(PRESET_EXPRESSIONS)) {
      for (const id of [expr.eyes, expr.brows, expr.mouth, ...(expr.extras ?? [])]) {
        expect(getPart(id), `${expr.id}: ${id}`).toBeDefined();
      }
    }
  });

  it('the default character points at existing parts in the right slots', () => {
    for (const [slot, id] of Object.entries(createDefaultCharacter().parts)) {
      expect(getPart(id)?.slot, id).toBe(slot);
    }
  });
});
