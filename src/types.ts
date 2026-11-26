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

/** slots an expression can override */
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

export type Hex = string;

export interface Part {
  /** e.g. "hair-front/messy-fringe" */
  id: string;
  slot: Slot;
  label: string;
  /** inner SVG, colours as var(--token) */
  svg: string;
  tags?: string[];
  offset?: { x: number; y: number };
}

export type PresetExpressionId = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised';
// `string & {}` keeps autocomplete for presets but allows custom ids
export type ExpressionId = PresetExpressionId | (string & {});

export interface Expression {
  id: ExpressionId;
  eyes: string;
  brows: string;
  mouth: string;
  /** replaces the default extras when set */
  extras?: string[];
}

export interface Character {
  /** used in file names */
  name: string;
  /** slot -> part id; face slots are the neutral defaults */
  parts: Partial<Record<Slot, string>>;
  /** base colours + any shade overrides */
  colors: Partial<Record<ColorToken, Hex>>;
  /** which ones get exported */
  expressions: ExpressionId[];
  customExpressions: Expression[];
  version: 1;
}
