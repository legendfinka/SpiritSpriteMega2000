import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  type BaseToken,
  DEFAULT_BASE_COLORS,
  DERIVED_TOKENS,
  type DerivedToken,
  isDerivedToken,
} from '../canvas/colors';
import { expressionNameError, toExpressionName, uniqueExpressionName } from '../expressions/names';
import { takenExpressionIds } from '../expressions/presets';
import type { Character, ColorToken, Expression, ExpressionId, Hex, Part, Slot } from '../types';
import {
  type CastState,
  castWithActive,
  freshCast,
  MAX_CAST,
  newMemberId,
  restoreCast,
  uniqueCharacterName,
} from './cast';
import { createDefaultCharacter } from './defaultCharacter';

export const STORAGE_KEY = 'spirit-sprite-character';
const HISTORY_LIMIT = 100;
// edits with the same key this close together become one undo step (colour drags, typing)
const MERGE_MS = 1000;
// slots that can't be empty; a removed upload falls back to the default part
const REQUIRED_SLOTS: readonly Slot[] = ['body', 'face', 'eyes', 'brows', 'mouth'];

export type ExpressionPatch = Partial<Pick<Expression, 'eyes' | 'brows' | 'mouth' | 'extras'>>;

interface CharacterState extends CastState {
  /** whole-cast snapshots, so undo also covers adding and removing characters */
  past: CastState[];
  future: CastState[];
  undo: () => void;
  redo: () => void;
  /** switches characters; not an undo step */
  selectCharacter: (id: string) => void;
  /** adds a copy of `character` (or a default one) and selects it */
  addCharacter: (character?: Character) => void;
  duplicateCharacter: () => void;
  /** the last one can't go */
  removeCharacter: (id: string) => void;
  addCustomPart: (part: Part) => void;
  /** also swaps it out wherever it's used */
  removeCustomPart: (id: string) => void;
  setName: (name: string) => void;
  /** undefined empties the slot */
  setPart: (slot: Slot, partId: string | undefined) => void;
  setColor: (token: ColorToken, hex: Hex) => void;
  /** a preset swatch: sets bases and puts their shades back to auto */
  applyColors: (patch: Partial<Record<BaseToken, Hex>>) => void;
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

      const snapshot = ({ character, cast, activeId }: CastState): CastState => ({
        character,
        cast,
        activeId,
      });

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
            past: merge ? state.past : [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
            future: [],
          };
        });

      // adding/removing characters: also undoable
      const commitCast = (next: (s: CastState) => CastState | null) =>
        set((state) => {
          const result = next(state);
          if (!result) return state;
          lastKey = undefined;
          return {
            ...result,
            past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
            future: [],
          };
        });

      const addMember = (s: CastState, character: Character): CastState | null => {
        if (s.cast.length >= MAX_CAST) return null;
        const cast = castWithActive(s);
        const member = {
          id: newMemberId(),
          character: { ...character, name: uniqueCharacterName(character.name, cast) },
        };
        return { cast: [...cast, member], activeId: member.id, character: member.character };
      };

      const update = (change: (c: Character) => Partial<Character>, mergeKey?: string) =>
        commit((c) => {
          const patch = change(c);
          const same = Object.entries(patch).every(([k, v]) => c[k as keyof Character] === v);
          return same ? c : { ...c, ...patch };
        }, mergeKey);

      return {
        ...freshCast(),
        past: [],
        future: [],
        undo: () => {
          lastKey = undefined;
          set((s) => {
            const prev = s.past.at(-1);
            if (!prev) return s;
            return { ...prev, past: s.past.slice(0, -1), future: [snapshot(s), ...s.future] };
          });
        },
        redo: () => {
          lastKey = undefined;
          set((s) => {
            const [next, ...rest] = s.future;
            if (!next) return s;
            return { ...next, past: [...s.past, snapshot(s)], future: rest };
          });
        },
        selectCharacter: (id) => {
          lastKey = undefined;
          set((s) => {
            const member = s.cast.find((m) => m.id === id);
            if (!member || id === s.activeId) return s;
            return { cast: castWithActive(s), activeId: id, character: member.character };
          });
        },
        addCharacter: (character = createDefaultCharacter()) =>
          commitCast((s) => addMember(s, character)),
        duplicateCharacter: () => commitCast((s) => addMember(s, s.character)),
        removeCharacter: (id) =>
          commitCast((s) => {
            if (s.cast.length <= 1) return null;
            const cast = castWithActive(s);
            const i = cast.findIndex((m) => m.id === id);
            if (i < 0) return null;
            const rest = cast.filter((m) => m.id !== id);
            if (id !== s.activeId) return { character: s.character, cast: rest, activeId: s.activeId };
            // select the neighbour
            const next = rest[Math.min(i, rest.length - 1)] ?? rest[0];
            return next ? { cast: rest, activeId: next.id, character: next.character } : null;
          }),
        addCustomPart: (part) => update((c) => ({ customParts: [...(c.customParts ?? []), part] })),
        removeCustomPart: (id) =>
          update((c) => {
            const fallback = createDefaultCharacter().parts;
            const parts = { ...c.parts };
            for (const slot of Object.keys(parts) as Slot[]) {
              if (parts[slot] !== id) continue;
              if (REQUIRED_SLOTS.includes(slot)) parts[slot] = fallback[slot];
              else delete parts[slot];
            }
            const rest = (c.customParts ?? []).filter((p) => p.id !== id);
            return {
              parts,
              customParts: rest.length > 0 ? rest : undefined,
              customExpressions: c.customExpressions.map((e) => ({
                ...e,
                eyes: e.eyes === id ? (fallback.eyes ?? e.eyes) : e.eyes,
                brows: e.brows === id ? (fallback.brows ?? e.brows) : e.brows,
                mouth: e.mouth === id ? (fallback.mouth ?? e.mouth) : e.mouth,
                extras: e.extras?.filter((x) => x !== id),
              })),
            };
          }),
        setName: (name) => update(() => ({ name }), 'name'),
        setPart: (slot, partId) =>
          update((c) => {
            const parts = { ...c.parts };
            if (partId === undefined) delete parts[slot];
            else parts[slot] = partId;
            // a one-piece replaces top and bottom, and the other way round
            if (partId && slot === 'outfit') {
              delete parts.top;
              delete parts.bottom;
            }
            if (partId && (slot === 'top' || slot === 'bottom')) delete parts.outfit;
            return { parts };
          }),
        setColor: (token, hex) =>
          update((c) => ({ colors: { ...c.colors, [token]: hex } }), `color:${token}`),
        applyColors: (patch) =>
          update((c) => {
            const colors: Character['colors'] = { ...c.colors, ...patch };
            for (const [shade, [base]] of Object.entries(DERIVED_TOKENS)) {
              if (base in patch) delete colors[shade as DerivedToken];
            }
            return { colors };
          }),
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
      // 1: one character, 2: the cast. restoreCast reads both
      version: 2,
      migrate: (persisted) => persisted,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cast: castWithActive(s), activeId: s.activeId }),
      // skip saved data that isn't a character
      merge: (persisted, current) => {
        const saved = restoreCast(persisted);
        return saved ? { ...current, ...saved } : current;
      },
    },
  ),
);
