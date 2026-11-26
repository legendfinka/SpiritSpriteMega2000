import { describe, expect, it } from 'vitest';
import { createDefaultCharacter } from '../store/defaultCharacter';
import type { Character } from '../types';
import { characterFromJson, characterToJson } from './characterJson';

describe('character JSON', () => {
  it('save -> load round-trips to an identical character', () => {
    const character: Character = {
      ...createDefaultCharacter(),
      name: 'Mira',
      colors: { hair: '#ff00ff', 'hair-shade': '#123456' },
      expressions: ['neutral', 'smug'],
      customExpressions: [
        { id: 'smug', eyes: 'eyes/narrow', brows: 'brows/happy', mouth: 'mouth/smile', extras: [] },
      ],
    };
    expect(characterFromJson(characterToJson(character))).toEqual(character);
  });

  it('rejects broken or foreign files', () => {
    expect(characterFromJson('not json')).toBeNull();
    expect(characterFromJson('{"hello": "world"}')).toBeNull();
    expect(characterFromJson('[]')).toBeNull();
  });
});
