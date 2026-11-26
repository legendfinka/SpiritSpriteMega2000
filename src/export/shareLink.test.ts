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

  it('keeps an imported name on one line', () => {
    const name = `a\nb${LINE_SEPARATOR}c`;
    const hash = shareHash({ ...createDefaultCharacter(), name });
    expect(characterFromHash(hash)?.name).toBe('a b c');
  });
});
