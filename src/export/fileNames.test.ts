import { describe, expect, it } from 'vitest';
import { jsonFileName, spriteFileName, toImageTag, zipFileName } from './fileNames';

describe('export file names', () => {
  it('match "<name> <expression>.png" exactly', () => {
    expect(spriteFileName('Oleh', 'happy', 'png')).toBe('oleh happy.png');
    expect(spriteFileName('Big Guy', 'very_happy', 'webp')).toBe('big_guy very_happy.webp');
  });

  it('turn the character name into one Ren\'Py word', () => {
    expect(toImageTag('  Mira-Chan ')).toBe('mira_chan');
    expect(toImageTag('7up')).toBe('c_7up');
    expect(toImageTag('Ёжик')).toBe('character');
    expect(toImageTag('')).toBe('character');
  });

  it('name the zip and json after the character', () => {
    expect(zipFileName('Oleh')).toBe('oleh_sprites.zip');
    expect(jsonFileName('Oleh')).toBe('oleh.json');
  });
});
