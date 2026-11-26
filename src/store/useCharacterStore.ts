import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_BASE_COLORS, isDerivedToken } from '../canvas/colors';
import { expressionNameError, toExpressionName, uniqueExpressionName } from '../expressions/names';
import { takenExpressionIds } from '../expressions/presets';
import type { Character, ColorToken, Expression, ExpressionId, Hex, Slot } from '../types';
import { createDefaultCharacter } from './defaultCharacter';
import { parseCharacter } from './parseCharacter';

export const STORAGE_KEY = 'spirit-sprite-character';

export type ExpressionPatch = Partial<Pick<Expression, 'eyes' | 'brows' | 'mouth' | 'extras'>>;

interface CharacterState {
  character: Character;
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
      const update = (change: (c: Character) => Partial<Character>) =>
        set((state) => ({ character: { ...state.character, ...change(state.character) } }));

      return {
        character: createDefaultCharacter(),
        setName: (name) => update(() => ({ name })),
        setPart: (slot, partId) =>
          update((c) => {
            const parts = { ...c.parts };
            if (partId === undefined) delete parts[slot];
            else parts[slot] = partId;
            return { parts };
          }),
        setColor: (token, hex) => update((c) => ({ colors: { ...c.colors, [token]: hex } })),
        resetColor: (token) =>
          update((c) => {
            const colors = { ...c.colors };
            if (isDerivedToken(token)) delete colors[token];
            else colors[token] = DEFAULT_BASE_COLORS[token];
            return { colors };
          }),
        resetCharacter: () => set({ character: createDefaultCharacter() }),
        loadCharacter: (character) => set({ character }),
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
