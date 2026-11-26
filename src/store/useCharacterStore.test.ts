import { beforeEach, describe, expect, it } from 'vitest';
import { createDefaultCharacter } from './defaultCharacter';
import { STORAGE_KEY, useCharacterStore } from './useCharacterStore';

const state = () => useCharacterStore.getState();

beforeEach(() => {
  state().resetCharacter();
  useCharacterStore.setState({ past: [], future: [] });
});

describe('undo / redo', () => {
  it('steps back and forward through edits', () => {
    state().setPart('hairFront', undefined);
    state().setName('mira');
    state().undo();
    expect(state().character.name).toBe('guy');
    state().undo();
    expect(state().character.parts.hairFront).toBe('hair-front/messy-fringe');
    state().redo();
    expect(state().character.parts.hairFront).toBeUndefined();
    expect(state().future).toHaveLength(1);
  });

  it('merges a quick run of colour changes into one step', () => {
    state().setColor('hair', '#111111');
    state().setColor('hair', '#222222');
    state().setColor('hair', '#333333');
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(state().character.colors.hair).toBe(createDefaultCharacter().colors.hair);
  });

  it('keeps different edits as separate steps', () => {
    state().setColor('hair', '#111111');
    state().setColor('skin', '#222222');
    expect(state().past).toHaveLength(2);
  });

  it('clears redo after a new edit', () => {
    state().setName('a');
    state().undo();
    state().setName('b');
    expect(state().future).toEqual([]);
  });

  it('ignores edits that change nothing', () => {
    state().setExpressionExported('neutral', true);
    state().undo();
    expect(state().past).toEqual([]);
  });

  it('can undo a reset and a load', () => {
    state().setName('mira');
    state().resetCharacter();
    state().undo();
    expect(state().character.name).toBe('mira');
    state().loadCharacter({ ...createDefaultCharacter(), name: 'loaded' });
    state().undo();
    expect(state().character.name).toBe('mira');
  });
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

  it('loads saves made before custom expressions existed', async () => {
    const old: Record<string, unknown> = { ...createDefaultCharacter(), name: 'old' };
    delete old.customExpressions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { character: old }, version: 1 }));
    await useCharacterStore.persist.rehydrate();
    expect(state().character.name).toBe('old');
    expect(state().character.customExpressions).toEqual([]);
  });
});

describe('custom expressions', () => {
  const happy = {
    id: 'happy',
    eyes: 'eyes/closed-happy',
    brows: 'brows/happy',
    mouth: 'mouth/smile',
    extras: ['extras/blush'],
  };

  it('adds a copy with a free name and marks it for export', () => {
    const id = state().addExpression(happy);
    expect(id).toBe('happy_2');
    expect(state().character.customExpressions).toEqual([{ ...happy, id: 'happy_2' }]);
    expect(state().character.expressions).toContain('happy_2');
  });

  it('updates only the given expression', () => {
    const id = state().addExpression(happy);
    state().updateExpression(id, { eyes: 'eyes/wide', extras: [] });
    expect(state().character.customExpressions[0]).toMatchObject({ eyes: 'eyes/wide', extras: [] });
    expect(state().character.parts.eyes).toBe('eyes/normal');
  });

  it('renames and keeps the export list in sync', () => {
    const id = state().addExpression(happy);
    expect(state().renameExpression(id, 'Smug Grin')).toEqual({ id: 'smug_grin' });
    expect(state().character.customExpressions[0]?.id).toBe('smug_grin');
    expect(state().character.expressions).toContain('smug_grin');
    expect(state().character.expressions).not.toContain(id);
  });

  it('refuses a name that is taken or invalid', () => {
    const id = state().addExpression(happy);
    expect(state().renameExpression(id, 'sad')).toEqual({ error: 'Name already used' });
    expect(state().renameExpression(id, '!!!')).toEqual({ error: 'Enter a name' });
    expect(state().character.customExpressions[0]?.id).toBe(id);
  });

  it('removes an expression from both lists', () => {
    const id = state().addExpression(happy);
    state().removeExpression(id);
    expect(state().character.customExpressions).toEqual([]);
    expect(state().character.expressions).not.toContain(id);
  });
});
