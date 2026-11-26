import JSZip from 'jszip';
import { renderSvgString } from '../canvas/svgString';
import type { Character, Expression } from '../types';
import { characterToJson } from './characterJson';
import { type ImageFormat, spriteFileName } from './fileNames';
import { readmeText } from './renpySnippet';

export type Scale = 0.5 | 1 | 2;

export interface ExportOptions {
  scale: Scale;
  format: ImageFormat;
  includeJson: boolean;
}

/** svg -> image bytes; tests pass a fake */
export type Rasterize = (svg: string, format: ImageFormat) => Promise<Uint8Array>;

/** what the zip will contain, in order */
export function exportFileNames(
  character: Character,
  expressions: readonly Expression[],
  options: ExportOptions,
): string[] {
  return [
    ...expressions.map((e) => spriteFileName(character.name, e.id, options.format)),
    ...(options.includeJson ? ['character.json'] : []),
    'README.txt',
  ];
}

/** raw zip bytes, wrap in a Blob to download */
export async function buildSpriteZip(
  character: Character,
  expressions: readonly Expression[],
  options: ExportOptions,
  rasterize: Rasterize,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const zip = new JSZip();
  // one at a time, 2x sprites are big
  for (const [i, expression] of expressions.entries()) {
    const svg = renderSvgString(character, expression, options.scale);
    const image = await rasterize(svg, options.format);
    zip.file(spriteFileName(character.name, expression.id, options.format), image);
    onProgress?.(i + 1, expressions.length);
  }
  if (options.includeJson) zip.file('character.json', characterToJson(character));
  zip.file('README.txt', readmeText(character, expressions.map((e) => e.id)));
  return zip.generateAsync({ type: 'uint8array' });
}
