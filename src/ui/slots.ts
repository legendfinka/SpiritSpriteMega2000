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

/** Slots that may be left empty. */
export const OPTIONAL_SLOTS: readonly Slot[] = [
  'outfit',
  'hairBack',
  'hairFront',
  'extras',
  'accessory',
];

/** Slots whose preview is only visible on the neutral expression. */
export const FACE_SLOTS: readonly Slot[] = ['eyes', 'brows', 'mouth', 'extras'];

/** Slots best previewed on the whole sprite rather than a head crop. */
export const FULL_BODY_SLOTS: readonly Slot[] = ['body', 'outfit'];
