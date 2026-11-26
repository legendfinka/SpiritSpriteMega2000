import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_BASE_COLORS, isDerivedToken } from '../canvas/colors';
import type { Character, ColorToken, Hex, Slot } from '../types';
import { createDefaultCharacter } from './defaultCharacter';
import { isCharacter } from './isCharacter';

export const STORAGE_KEY = 'spirit-sprite-character';

interface CharacterState {
  character: Character;
  setName: (name: string) => void;
  /** Pass undefined to empty the slot. */
  setPart: (slot: Slot, partId: string | undefined) => void;
  setColor: (token: ColorToken, hex: Hex) => void;
  /** Derived tokens go back to automatic, base tokens to their default. */
  resetColor: (token: ColorToken) => void;
  resetCharacter: () => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => {
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
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ character }) => ({ character }),
      // Ignore saved data that doesn't look like a character.
      merge: (persisted, current) => {
        const saved = (persisted as { character?: unknown } | undefined)?.character;
        return isCharacter(saved) ? { ...current, character: saved } : current;
      },
    },
  ),
);
