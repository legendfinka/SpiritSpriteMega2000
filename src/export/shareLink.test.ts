import { describe, expect, it } from 'vitest';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { characterFromHash, shareHash, shareUrl } from './shareLink';

// built from its code, since editors can turn an escape into an invisible character
const LINE_SEPARATOR = String.fromCharCode(0x2028);

describe('share links', () => {
  it('round-trips a character, including non-Latin names', () => {
    const character = { ...createDefaultCharacter(), name: 'Мира ✨' };
    const hash = shareHash(character);
    expect(hash).toMatch(/^#c=[A-Za-z0-9_-]+$/);
    expect(characterFromHash(hash)).toEqual(character);
  });

  it('puts the character after the page address', () => {
    const url = shareUrl(createDefaultCharacter(), {
      origin: 'https://example.com',
      pathname: '/app/',
    });
    expect(url.startsWith('https://example.com/app/#c=')).toBe(true);
  });

  it('returns null for broken or foreign hashes', () => {
    const cut = shareHash(createDefaultCharacter()).slice(0, 40);
    for (const hash of ['', '#about', '#c=', '#c=!!!', '#c=e30', cut]) {
      expect(characterFromHash(hash), hash).toBeNull();
    }
  });

  it('rejects expression ids that could escape file names or scripts', () => {
    const bad = { id: '../x', eyes: 'eyes/normal', brows: 'brows/neutral', mouth: 'mouth/neutral' };
    const hash = shareHash({ ...createDefaultCharacter(), customExpressions: [bad] });
    expect(characterFromHash(hash)).toBeNull();
  });

  it('carries uploaded parts, cleaned again on the way in', () => {
    const hat = {
      id: 'custom/hat',
      slot: 'accessory' as const,
      label: 'Hat',
      svg: '<path d="M0 0" fill="var(--hair)" onload="alert(1)"/><script>alert(1)</script>',
    };
    const loaded = characterFromHash(
      shareHash({ ...createDefaultCharacter(), customParts: [hat] }),
    );
    expect(loaded?.customParts).toEqual([{ ...hat, svg: '<path d="M0 0" fill="var(--hair)"/>' }]);
  });

  it.each([
    ['a bad id', { id: '../hat', slot: 'accessory', label: 'x', svg: '<path d="M0 0"/>' }],
    ['an unknown slot', { id: 'custom/hat', slot: 'wings', label: 'x', svg: '<path d="M0 0"/>' }],
    ['an unknown token', { id: 'custom/hat', slot: 'accessory', label: 'x', svg: '<path fill="var(--x)"/>' }],
  ])('refuses a character with %s in its uploads', (_name, part) => {
    const hash = shareHash({ ...createDefaultCharacter(), customParts: [part as never] });
    expect(characterFromHash(hash)).toBeNull();
  });

  it('keeps an imported name on one line', () => {
    const name = `a\nb${LINE_SEPARATOR}c`;
    const hash = shareHash({ ...createDefaultCharacter(), name });
    expect(characterFromHash(hash)?.name).toBe('a b c');
  });
});
