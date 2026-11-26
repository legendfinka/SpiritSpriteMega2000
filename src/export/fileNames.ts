import type { ExpressionId } from '../types';

export type ImageFormat = 'png' | 'webp';

/** name as a Ren'Py tag: "Big Guy" -> "big_guy" */
export function toImageTag(name: string): string {
  const tag = name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  if (tag === '') return 'character';
  return /^[a-z]/.test(tag) ? tag : `c_${tag}`;
}

/** e.g. "oleh happy.png" */
export function spriteFileName(name: string, expression: ExpressionId, format: ImageFormat): string {
  return `${toImageTag(name)} ${expression}.${format}`;
}

/** e.g. "side oleh happy.png"; no expression = the fallback "side oleh.png" */
export function sideFileName(
  name: string,
  expression: ExpressionId | undefined,
  format: ImageFormat,
): string {
  return `side ${toImageTag(name)}${expression ? ` ${expression}` : ''}.${format}`;
}

export function zipFileName(name: string): string {
  return `${toImageTag(name)}_sprites.zip`;
}

export function jsonFileName(name: string): string {
  return `${toImageTag(name)}.json`;
}

export const MIME_TYPES: Record<ImageFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
};
