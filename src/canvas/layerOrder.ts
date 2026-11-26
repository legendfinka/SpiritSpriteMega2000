import type { Slot } from '../types';

/** back to front; the only place this lives, ask before changing it */
export const LAYER_ORDER: readonly Slot[] = [
  'body',
  'outfit',
  'hairBack',
  'face',
  'eyes',
  'brows', // under hairFront so the fringe can cover them
  'hairFront',
  'mouth',
  'extras',
  'accessory',
];

export function layerIndex(slot: Slot): number {
  return LAYER_ORDER.indexOf(slot);
}
