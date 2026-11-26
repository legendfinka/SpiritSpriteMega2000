export type Slot =
  | 'body'
  | 'outfit'
  | 'hairBack'
  | 'face'
  | 'eyes'
  | 'brows'
  | 'mouth'
  | 'hairFront'
  | 'extras'
  | 'accessory';

/** Slots an expression is allowed to override. */
export type FaceSlot = 'eyes' | 'brows' | 'mouth' | 'extras';

export const COLOR_TOKENS = [
  'skin',
  'skin-shade',
  'hair',
  'hair-shade',
  'hair-hi',
  'iris',
  'outfit-main',
  'outfit-shade',
  'outfit-accent',
  'pants',
  'pants-shade',
  'outline',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

/** Hex colour string, e.g. "#a1b2c3". */
export type Hex = string;

export interface Part {
  /** "<folder>/<file-name>", e.g. "hair-front/messy-fringe". */
  id: string;
  slot: Slot;
  label: string;
  /** Raw SVG fragment (no outer <svg>), colours as var(--token). */
  svg: string;
  tags?: string[];
  offset?: { x: number; y: number };
}

export type PresetExpressionId = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
// `string & {}` keeps editor autocomplete for the presets while allowing custom ids.
export type ExpressionId = PresetExpressionId | (string & {});

export interface Expression {
  id: ExpressionId;
  eyes: string;
  brows: string;
  mouth: string;
  /** When set, replaces the character's default extras. */
  extras?: string[];
}

export interface Character {
  /** Used in export file names. */
  name: string;
  /** slot -> part id. Face slots hold the defaults an expression overrides. */
  parts: Partial<Record<Slot, string>>;
  /** Base colours plus any explicit shade/highlight overrides. */
  colors: Partial<Record<ColorToken, Hex>>;
  /** Which expressions to export. */
  expressions: ExpressionId[];
  version: 1;
}
