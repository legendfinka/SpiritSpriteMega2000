import type { Slot } from '../types';

export const SLOT_LABELS: Record<Slot, string> = {
  body: 'Body',
  outfit: 'Outfit',
  hairBack: 'Back hair',
  face: 'Face',
  eyes: 'Eyes',
  brows: 'Brows',
  mouth: 'Mouth',
  hairFront: 'Front hair',
  extras: 'Extras',
  accessory: 'Accessory',
};

/** can be left empty */
export const OPTIONAL_SLOTS: readonly Slot[] = [
  'outfit',
  'hairBack',
  'hairFront',
  'extras',
  'accessory',
];

/** slots that expressions override */
export const FACE_SLOTS: readonly Slot[] = ['eyes', 'brows', 'mouth', 'extras'];

/** thumbnails show the full body, not a head crop */
export const FULL_BODY_SLOTS: readonly Slot[] = ['body', 'outfit'];
