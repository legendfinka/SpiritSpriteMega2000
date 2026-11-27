import type { Slot } from '../types';

/** can be left empty */
export const OPTIONAL_SLOTS: readonly Slot[] = [
  'bottom',
  'top',
  'outfit',
  'hairBack',
  'hairFront',
  'extras',
  'accessory',
];

/** slots that expressions override */
export const FACE_SLOTS: readonly Slot[] = ['eyes', 'brows', 'mouth', 'extras'];

/** thumbnails show the full body, not a head crop */
export const FULL_BODY_SLOTS: readonly Slot[] = ['body', 'bottom', 'top', 'outfit'];
