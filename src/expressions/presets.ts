import type { Character, Expression, ExpressionId, PresetExpressionId } from '../types';

export const PRESET_EXPRESSIONS: Record<PresetExpressionId, Expression> = {
  neutral: {
    id: 'neutral',
    eyes: 'eyes/normal',
    brows: 'brows/neutral',
    mouth: 'mouth/neutral',
    extras: [],
  },
  happy: {
    id: 'happy',
    eyes: 'eyes/closed-happy',
    brows: 'brows/happy',
    mouth: 'mouth/smile',
    extras: ['extras/blush'],
  },
  sad: {
    id: 'sad',
    eyes: 'eyes/sad',
    brows: 'brows/sad',
    mouth: 'mouth/frown',
    extras: ['extras/tears'],
  },
  angry: {
    id: 'angry',
    eyes: 'eyes/narrow',
    brows: 'brows/angry',
    mouth: 'mouth/grit',
    extras: ['extras/anger-mark'],
  },
  surprised: {
    id: 'surprised',
    eyes: 'eyes/wide',
    brows: 'brows/raised',
    mouth: 'mouth/open-o',
    extras: ['extras/sweat-drop'],
  },
};

/** neutral uses the character's own face, other presets are fixed */
export function getPresetExpression(id: PresetExpressionId, character: Character): Expression {
  const preset = PRESET_EXPRESSIONS[id];
  if (id !== 'neutral') return preset;
  const { eyes, brows, mouth } = character.parts;
  return {
    id,
    eyes: eyes ?? preset.eyes,
    brows: brows ?? preset.brows,
    mouth: mouth ?? preset.mouth,
    // the character's extras are always drawn, so neutral adds none
    extras: [],
  };
}

export const PRESET_IDS: readonly PresetExpressionId[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'surprised',
];

export function isPresetId(id: ExpressionId): id is PresetExpressionId {
  return (PRESET_IDS as readonly string[]).includes(id);
}

/** presets, then custom ones */
export function listExpressions(character: Character): Expression[] {
  return [...PRESET_IDS.map((id) => getPresetExpression(id, character)), ...character.customExpressions];
}

export function getExpression(id: ExpressionId, character: Character): Expression | undefined {
  if (isPresetId(id)) return getPresetExpression(id, character);
  return character.customExpressions.find((e) => e.id === id);
}

/** all ids in use */
export function takenExpressionIds(character: Character): string[] {
  return [...PRESET_IDS, ...character.customExpressions.map((e) => e.id)];
}
