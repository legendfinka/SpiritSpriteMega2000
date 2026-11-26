import { describe, expect, it } from 'vitest';
import { getPart } from '../parts/registry';
import { createDefaultCharacter } from './defaultCharacter';
import { parseCharacter } from './parseCharacter';
import { randomCharacter } from './randomCharacter';

describe('randomCharacter', () => {
  it('only uses real parts in the right slots, at both ends of the range', () => {
    for (const value of [0, 0.1, 0.5, 0.999999]) {
      const result = randomCharacter(createDefaultCharacter(), () => value);
      for (const [slot, id] of Object.entries(result.parts)) {
        expect(getPart(id)?.slot, id).toBe(slot);
      }
      expect(parseCharacter(result)).toEqual(result);
    }
  });

  it('keeps the name and expressions and drops shade overrides', () => {
    const base = { ...createDefaultCharacter(), name: 'Mira', colors: { 'hair-hi': '#ffffff' } };
    const result = randomCharacter(base, () => 0.5);
    expect(result.name).toBe('Mira');
    expect(result.expressions).toEqual(base.expressions);
    expect(result.colors['hair-hi']).toBeUndefined();
  });
});
