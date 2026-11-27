import { findPart } from '../parts/customParts';
import type { Character, ColorToken, Expression, Hex } from '../types';
import { inlineTokens, resolveColors } from './colors';
import { composeLayers, type Layer } from './compose';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1080;

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** head and shoulders, for Ren'Py side images */
export const SIDE_CROP: Crop = { x: 160, y: 0, width: 480, height: 480 };
/** side images come out at 300 px at 1x, a usual size next to the textbox */
export const SIDE_ZOOM = 0.625;

const FULL: Crop = { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };

/** standalone SVG with hex colours baked in, since canvas ignores CSS vars */
function svgDocument(
  layers: readonly Layer[],
  colors: Record<ColorToken, Hex>,
  crop: Crop,
  width: number,
  height: number,
): string {
  const body = layers
    .map(
      ({ slot, part }) =>
        `<g data-slot="${slot}" data-part="${part.id}">${inlineTokens(part.svg, colors)}</g>`,
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${crop.x} ${crop.y} ${crop.width} ${crop.height}">${body}</svg>`
  );
}

/** the whole sprite for one expression */
export function renderSvgString(character: Character, expression: Expression, scale = 1): string {
  return svgDocument(
    composeLayers(character, expression),
    resolveColors(character.colors),
    FULL,
    CANVAS_WIDTH * scale,
    CANVAS_HEIGHT * scale,
  );
}

/** head-and-shoulders crop for a Ren'Py side image */
export function renderSideSvgString(
  character: Character,
  expression: Expression,
  scale = 1,
): string {
  const size = Math.round(SIDE_CROP.width * SIDE_ZOOM * scale);
  return svgDocument(
    composeLayers(character, expression),
    resolveColors(character.colors),
    SIDE_CROP,
    size,
    size,
  );
}

/** only the given parts, drawn in the given order, on the full canvas (layered export) */
export function renderPartsSvgString(
  character: Character,
  partIds: readonly string[],
  scale = 1,
): string {
  const layers = partIds.flatMap((id) => {
    const part = findPart(character, id);
    return part ? [{ slot: part.slot, part }] : [];
  });
  return svgDocument(
    layers,
    resolveColors(character.colors),
    FULL,
    CANVAS_WIDTH * scale,
    CANVAS_HEIGHT * scale,
  );
}
