import type { Slot } from '../types';

/** back to front; the only place this lives, ask before changing it */
export const LAYER_ORDER: readonly Slot[] = [
  'hairBack', // behind the body so long hair falls behind the shoulders
  'body',
  'outfit',
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
