import type { Character, Expression, PresetExpressionId } from '../types';

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
    extras: [],
  },
  angry: {
    id: 'angry',
    eyes: 'eyes/narrow',
    brows: 'brows/angry',
    mouth: 'mouth/grit',
    extras: [],
  },
  surprised: {
    id: 'surprised',
    eyes: 'eyes/wide',
    brows: 'brows/raised',
    mouth: 'mouth/open-o',
    extras: ['extras/sweat-drop'],
  },
};

/** "neutral" shows the face chosen on the character; other presets override it. */
export function getPresetExpression(id: PresetExpressionId, character: Character): Expression {
  const preset = PRESET_EXPRESSIONS[id];
  if (id !== 'neutral') return preset;
  const { eyes, brows, mouth, extras } = character.parts;
  return {
    id,
    eyes: eyes ?? preset.eyes,
    brows: brows ?? preset.brows,
    mouth: mouth ?? preset.mouth,
    extras: extras ? [extras] : [],
  };
}

export const PRESET_IDS: readonly PresetExpressionId[] = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'surprised',
];
