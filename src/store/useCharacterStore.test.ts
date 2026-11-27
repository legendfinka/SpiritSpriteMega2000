import { beforeEach, describe, expect, it } from 'vitest';
import { castWithActive, freshCast } from './cast';
import { createDefaultCharacter } from './defaultCharacter';
import { STORAGE_KEY, useCharacterStore } from './useCharacterStore';

const state = () => useCharacterStore.getState();
const names = () => castWithActive(state()).map((m) => m.character.name);

beforeEach(() => {
  useCharacterStore.setState({ ...freshCast(), past: [], future: [] });
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
  it('swaps a one-piece for a top and bottom and back', () => {
    state().setPart('outfit', 'outfit/dress');
    expect(state().character.parts).not.toHaveProperty('top');
    expect(state().character.parts).not.toHaveProperty('bottom');
    state().setPart('bottom', 'bottom/shorts');
    expect(state().character.parts).not.toHaveProperty('outfit');
    expect(state().character.parts.bottom).toBe('bottom/shorts');
  });

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

  it('persists the cast to localStorage', () => {
    state().setName('mira');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const active = saved.state.cast.find((m: { id: string }) => m.id === saved.state.activeId);
    expect(active.character.name).toBe('mira');
  });

  it('restores a saved cast with the same character selected', async () => {
    const a = { ...createDefaultCharacter(), name: 'a' };
    const b = { ...createDefaultCharacter(), name: 'b' };
    const cast = [
      { id: 'x', character: a },
      { id: 'y', character: b },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { cast, activeId: 'y' }, version: 2 }));
    await useCharacterStore.persist.rehydrate();
    expect(state().character.name).toBe('b');
    expect(names()).toEqual(['a', 'b']);
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

describe('cast', () => {
  it('adds, switches and keeps each character’s edits', () => {
    state().setName('mira');
    state().addCharacter();
    expect(names()).toEqual(['mira', 'guy']);
    state().setName('kostya');
    const [first] = state().cast;
    state().selectCharacter(first!.id);
    expect(state().character.name).toBe('mira');
    expect(names()).toEqual(['mira', 'kostya']);
  });

  it('gives copies a name that won’t clash in exports', () => {
    state().duplicateCharacter();
    state().duplicateCharacter();
    expect(names()).toEqual(['guy', 'guy 2', 'guy 3']);
  });

  it('removes a character, selects a neighbour, and undo brings it back', () => {
    state().addCharacter({ ...createDefaultCharacter(), name: 'b' });
    const b = state().activeId;
    state().removeCharacter(b);
    expect(names()).toEqual(['guy']);
    expect(state().character.name).toBe('guy');
    state().undo();
    expect(names()).toEqual(['guy', 'b']);
    expect(state().character.name).toBe('b');
  });

  it('never removes the last character', () => {
    state().removeCharacter(state().activeId);
    expect(names()).toEqual(['guy']);
    expect(state().past).toEqual([]);
  });

  it('undo goes back across a switch to the character that changed', () => {
    state().setName('a');
    state().addCharacter({ ...createDefaultCharacter(), name: 'b' });
    state().setName('b2');
    state().undo();
    state().undo();
    expect(state().character.name).toBe('a');
    expect(names()).toEqual(['a']);
  });

  it('loads a pre-cast save as a cast of one', async () => {
    const character = { ...createDefaultCharacter(), name: 'old' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { character }, version: 1 }));
    await useCharacterStore.persist.rehydrate();
    expect(names()).toEqual(['old']);
  });
});

describe('custom parts', () => {
  const hat = { id: 'custom/hat', slot: 'accessory' as const, label: 'Hat', svg: '<path d="M0 0"/>' };
  const eyes = { id: 'custom/eyes', slot: 'eyes' as const, label: 'Eyes', svg: '<path d="M0 0"/>' };

  it('adds an upload and removes it from everywhere it was used', () => {
    state().addCustomPart(hat);
    state().addCustomPart(eyes);
    state().setPart('accessory', hat.id);
    state().setPart('eyes', eyes.id);
    const id = state().addExpression({ id: 'x', eyes: eyes.id, brows: 'brows/neutral', mouth: 'mouth/neutral' });

    state().removeCustomPart(eyes.id);
    expect(state().character.parts.eyes).toBe('eyes/normal');
    expect(state().character.customExpressions.find((e) => e.id === id)?.eyes).toBe('eyes/normal');
    state().removeCustomPart(hat.id);
    expect(state().character.parts).not.toHaveProperty('accessory');
    expect(state().character.customParts).toBeUndefined();
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
