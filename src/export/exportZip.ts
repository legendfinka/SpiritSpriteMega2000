import JSZip from 'jszip';
import { renderPartsSvgString, renderSideSvgString, renderSvgString } from '../canvas/svgString';
import { getPresetExpression } from '../expressions/presets';
import type { Character, Expression } from '../types';
import { characterToJson } from './characterJson';
import { type ImageFormat, sideFileName, spriteFileName } from './fileNames';
import { layeredPlan } from './layered';
import { readmeText } from './renpySnippet';

export type Scale = 0.5 | 1 | 2;
/** one flat PNG per expression, or parts + a Ren'Py layeredimage script */
export type ExportMode = 'sprites' | 'layered';

export interface ExportOptions {
  scale: Scale;
  format: ImageFormat;
  includeJson: boolean;
  mode: ExportMode;
  sideImages: boolean;
  /** layered only */
  blinkTalk: boolean;
}

/** svg -> image bytes; tests pass a fake */
export type Rasterize = (svg: string, format: ImageFormat) => Promise<Uint8Array>;

interface ExportPlan {
  /** rendered lazily, so listing names stays cheap */
  images: { name: string; svg: () => string }[];
  texts: { name: string; text: string }[];
}

export function exportPlan(
  character: Character,
  expressions: readonly Expression[],
  options: ExportOptions,
): ExportPlan {
  const { scale, format, mode, sideImages } = options;
  const images: ExportPlan['images'] = [];
  const texts: ExportPlan['texts'] = [];

  if (mode === 'layered') {
    const plan = layeredPlan(character, expressions, options);
    for (const img of plan.images) {
      images.push({
        name: `images/${img.name}.${format}`,
        svg: () => renderPartsSvgString(character, img.partIds, scale),
      });
    }
    texts.push({ name: `${plan.tag}_layered.rpy`, text: plan.script });
  } else {
    for (const e of expressions) {
      images.push({
        name: spriteFileName(character.name, e.id, format),
        svg: () => renderSvgString(character, e, scale),
      });
    }
    if (sideImages) {
      for (const e of expressions) {
        images.push({
          name: sideFileName(character.name, e.id, format),
          svg: () => renderSideSvgString(character, e, scale),
        });
      }
      // with no attributes: used when the character speaks without being on screen
      const neutral = getPresetExpression('neutral', character);
      images.push({
        name: sideFileName(character.name, undefined, format),
        svg: () => renderSideSvgString(character, neutral, scale),
      });
    }
  }

  if (options.includeJson) texts.push({ name: 'character.json', text: characterToJson(character) });
  texts.push({
    name: 'README.txt',
    text: readmeText(
      character,
      expressions.map((e) => e.id),
      options,
    ),
  });
  return { images, texts };
}

/** what the zip will contain, in order */
export function exportFileNames(
  character: Character,
  expressions: readonly Expression[],
  options: ExportOptions,
): string[] {
  const { images, texts } = exportPlan(character, expressions, options);
  return [...images.map((i) => i.name), ...texts.map((t) => t.name)];
}

/** raw zip bytes, wrap in a Blob to download */
export async function buildSpriteZip(
  character: Character,
  expressions: readonly Expression[],
  options: ExportOptions,
  rasterize: Rasterize,
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const { images, texts } = exportPlan(character, expressions, options);
  const zip = new JSZip();
  // one at a time, 2x sprites are big
  for (const [i, { name, svg }] of images.entries()) {
    zip.file(name, await rasterize(svg(), options.format));
    onProgress?.(i + 1, images.length);
  }
  for (const { name, text } of texts) zip.file(name, text);
  return zip.generateAsync({ type: 'uint8array' });
}
