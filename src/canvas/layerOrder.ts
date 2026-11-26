import type { Slot } from '../types';

/**
 * Draw order, back -> front. The single source of truth: never hard-code
 * slot order anywhere else. Changing it breaks every existing part, so ask first.
 *
 * Brows sit under hairFront so the fringe can cover them.
 */
export const LAYER_ORDER: readonly Slot[] = [
  'body',
  'outfit',
  'hairBack',
  'face',
  'eyes',
  'brows',
  'hairFront',
  'mouth',
  'extras',
  'accessory',
];

export function layerIndex(slot: Slot): number {
  return LAYER_ORDER.indexOf(slot);
}
