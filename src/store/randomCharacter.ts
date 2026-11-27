import { DEFAULT_BASE_COLORS } from '../canvas/colors';
import {
  HAIR_SWATCHES,
  IRIS_SWATCHES,
  OUTFIT_SWATCHES,
  SKIN_SWATCHES,
} from '../canvas/palettes';
import { partsForSlot } from '../parts/registry';
import type { Character, Slot } from '../types';
import { randomName } from './randomNames';

// the neutral face stays calm: no hearts or dizzy eyes by default
const CALM_FACE = {
  eyes: ['eyes/normal', 'eyes/half-lidded', 'eyes/sparkly', 'eyes/narrow'],
  brows: ['brows/neutral', 'brows/thick', 'brows/flat', 'brows/raised'],
  mouth: ['mouth/neutral', 'mouth/smile', 'mouth/smirk', 'mouth/cat'],
};
// only marks that make sense on every expression
const LASTING_EXTRAS = ['extras/freckles', 'extras/bandage'];

interface RandomOptions {
  /** also pick a new name (when the name lock is open) */
  name?: boolean;
}

/** new look and colours; expressions stay, the name too unless asked. `random` returns 0..1 */
export function randomCharacter(
  base: Character,
  random: () => number = Math.random,
  { name = false }: RandomOptions = {},
): Character {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  const part = (slot: Slot) => pick(partsForSlot(slot)).id;

  const parts: Character['parts'] = {
    body: part('body'),
    face: part('face'),
    eyes: pick(CALM_FACE.eyes),
    brows: pick(CALM_FACE.brows),
    mouth: pick(CALM_FACE.mouth),
    hairFront: part('hairFront'),
  };
  // mostly mix-and-match, sometimes a one-piece
  if (random() < 0.25) {
    parts.outfit = part('outfit');
  } else {
    parts.top = part('top');
    parts.bottom = part('bottom');
  }
  if (random() < 0.8) parts.hairBack = part('hairBack');
  if (random() < 0.35) parts.accessory = part('accessory');
  if (random() < 0.2) parts.extras = pick(LASTING_EXTRAS);

  return {
    ...base,
    name: name ? randomName(parts.body, base.name, random) : base.name,
    parts,
    // fresh object, so old shade overrides don't clash with the new bases
    colors: {
      ...DEFAULT_BASE_COLORS,
      ...pick(SKIN_SWATCHES).colors,
      ...pick(HAIR_SWATCHES).colors,
      ...pick(IRIS_SWATCHES).colors,
      ...pick(OUTFIT_SWATCHES).colors,
    },
  };
}
