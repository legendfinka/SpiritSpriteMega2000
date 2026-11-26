import { DEFAULT_BASE_COLORS } from '../canvas/colors';
import type { Character } from '../types';

export function createDefaultCharacter(): Character {
  return {
    name: 'guy',
    parts: {
      body: 'body/base-male',
      outfit: 'outfit/jacket-jeans',
      hairBack: 'hair-back/short',
      face: 'face/oval',
      eyes: 'eyes/normal',
      brows: 'brows/neutral',
      mouth: 'mouth/neutral',
      hairFront: 'hair-front/messy-fringe',
    },
    colors: { ...DEFAULT_BASE_COLORS },
    expressions: ['neutral', 'happy', 'sad', 'angry', 'surprised'],
    version: 1,
  };
}
