import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_BASE_COLORS, isDerivedToken } from '../canvas/colors';
import { expressionNameError, toExpressionName, uniqueExpressionName } from '../expressions/names';
import { takenExpressionIds } from '../expressions/presets';
import type { Character, ColorToken, Expression, ExpressionId, Hex, Slot } from '../types';
import { createDefaultCharacter } from './defaultCharacter';
import { parseCharacter } from './parseCharacter';

export const STORAGE_KEY = 'spirit-sprite-character';
const HISTORY_LIMIT = 100;
// edits with the same key this close together become one undo step (colour drags, typing)
const MERGE_MS = 1000;

export type ExpressionPatch = Partial<Pick<Expression, 'eyes' | 'brows' | 'mouth' | 'extras'>>;

interface CharacterState {
  character: Character;
  past: Character[];
  future: Character[];
  undo: () => void;
  redo: () => void;
  setName: (name: string) => void;
  /** undefined empties the slot */
  setPart: (slot: Slot, partId: string | undefined) => void;
  setColor: (token: ColorToken, hex: Hex) => void;
  /** shades back to auto, bases back to default */
  resetColor: (token: ColorToken) => void;
  resetCharacter: () => void;
  /** e.g. after loading a JSON file */
  loadCharacter: (character: Character) => void;
  setExpressionExported: (id: ExpressionId, exported: boolean) => void;
  /** copies `from`, returns the new id */
  addExpression: (from: Expression) => ExpressionId;
  updateExpression: (id: ExpressionId, patch: ExpressionPatch) => void;
  /** new id, or an error message */
  renameExpression: (id: ExpressionId, rawName: string) => { id: string } | { error: string };
  removeExpression: (id: ExpressionId) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => {
      let lastKey: string | undefined;
      let lastTime = 0;

      // every edit goes through here so it lands in the undo history
      const commit = (next: (c: Character) => Character, mergeKey?: string) =>
        set((state) => {
          const character = next(state.character);
          if (character === state.character) return state;
          const now = Date.now();
          const merge = mergeKey !== undefined && mergeKey === lastKey && now - lastTime < MERGE_MS;
          lastKey = mergeKey;
          lastTime = now;
          return {
            character,
            past: merge ? state.past : [...state.past, state.character].slice(-HISTORY_LIMIT),
            future: [],
          };
        });

      const update = (change: (c: Character) => Partial<Character>, mergeKey?: string) =>
        commit((c) => {
          const patch = change(c);
          const same = Object.entries(patch).every(([k, v]) => c[k as keyof Character] === v);
          return same ? c : { ...c, ...patch };
        }, mergeKey);

      return {
        character: createDefaultCharacter(),
        past: [],
        future: [],
        undo: () => {
          lastKey = undefined;
          set((s) => {
            const prev = s.past.at(-1);
            if (!prev) return s;
            return { character: prev, past: s.past.slice(0, -1), future: [s.character, ...s.future] };
          });
        },
        redo: () => {
          lastKey = undefined;
          set((s) => {
            const [next, ...rest] = s.future;
            if (!next) return s;
            return { character: next, past: [...s.past, s.character], future: rest };
          });
        },
        setName: (name) => update(() => ({ name }), 'name'),
        setPart: (slot, partId) =>
          update((c) => {
            const parts = { ...c.parts };
            if (partId === undefined) delete parts[slot];
            else parts[slot] = partId;
            return { parts };
          }),
        setColor: (token, hex) =>
          update((c) => ({ colors: { ...c.colors, [token]: hex } }), `color:${token}`),
        resetColor: (token) =>
          update((c) => {
            const colors = { ...c.colors };
            if (isDerivedToken(token)) delete colors[token];
            else colors[token] = DEFAULT_BASE_COLORS[token];
            return { colors };
          }),
        resetCharacter: () => commit(() => createDefaultCharacter()),
        loadCharacter: (character) => commit(() => character),
        setExpressionExported: (id, exported) =>
          update((c) => ({
            expressions: exported
              ? c.expressions.includes(id)
                ? c.expressions
                : [...c.expressions, id]
              : c.expressions.filter((e) => e !== id),
          })),

        addExpression: (from) => {
          const id = uniqueExpressionName(from.id, takenExpressionIds(get().character));
          const copy: Expression = {
            id,
            eyes: from.eyes,
            brows: from.brows,
            mouth: from.mouth,
            extras: [...(from.extras ?? [])],
          };
          update((c) => ({
            customExpressions: [...c.customExpressions, copy],
            expressions: [...c.expressions, id],
          }));
          return id;
        },
        updateExpression: (id, patch) =>
          update((c) => ({
            customExpressions: c.customExpressions.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        renameExpression: (id, rawName) => {
          const name = toExpressionName(rawName);
          if (name === id) return { id };
          const taken = takenExpressionIds(get().character).filter((t) => t !== id);
          const error = expressionNameError(name, taken);
          if (error) return { error };
          update((c) => ({
            customExpressions: c.customExpressions.map((e) => (e.id === id ? { ...e, id: name } : e)),
            expressions: c.expressions.map((e) => (e === id ? name : e)),
          }));
          return { id: name };
        },
        removeExpression: (id) =>
          update((c) => ({
            customExpressions: c.customExpressions.filter((e) => e.id !== id),
            expressions: c.expressions.filter((e) => e !== id),
          })),
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ character }) => ({ character }),
      // skip saved data that isn't a character
      merge: (persisted, current) => {
        const saved = parseCharacter((persisted as { character?: unknown } | undefined)?.character);
        return saved ? { ...current, character: saved } : current;
      },
    },
  ),
);
