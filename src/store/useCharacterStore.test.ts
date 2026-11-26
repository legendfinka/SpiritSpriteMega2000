import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultCharacter } from './defaultCharacter';
import { STORAGE_KEY, useCharacterStore } from './useCharacterStore';

const state = () => useCharacterStore.getState();

beforeEach(() => {
  state().resetCharacter();
});

describe('useCharacterStore', () => {
  it('sets and empties a slot', () => {
    state().setPart('hairFront', undefined);
    expect(state().character.parts).not.toHaveProperty('hairFront');
    state().setPart('hairFront', 'hair-front/messy-fringe');
    expect(state().character.parts.hairFront).toBe('hair-front/messy-fringe');
  });

  it('resets a shade to automatic and a base colour to its default', () => {
    state().setColor('hair-shade', '#123456');
    state().setColor('hair', '#ff00ff');
    state().resetColor('hair-shade');
    state().resetColor('hair');
    expect(state().character.colors).toEqual(createDefaultCharacter().colors);
  });

  it('persists the character to localStorage', () => {
    state().setName('mira');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.state.character.name).toBe('mira');
  });

  it('restores a saved character', async () => {
    const character = { ...createDefaultCharacter(), name: 'saved' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { character }, version: 1 }));
    await useCharacterStore.persist.rehydrate();
    expect(state().character).toEqual(character);
  });

  it('ignores invalid saved data', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { character: { name: 5 } }, version: 1 }),
    );
    await useCharacterStore.persist.rehydrate();
    expect(state().character).toEqual(createDefaultCharacter());
  });
});
