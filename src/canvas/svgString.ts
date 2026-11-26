import type { Character, Expression } from '../types';
import { inlineTokens, resolveColors } from './colors';
import { composeLayers, offsetTransform } from './compose';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1080;

/** standalone SVG with hex colours baked in, since canvas ignores CSS vars */
export function renderSvgString(character: Character, expression: Expression, scale = 1): string {
  const colors = resolveColors(character.colors);
  const body = composeLayers(character, expression)
    .map(({ slot, part }) => {
      const t = offsetTransform(part);
      const attrs = `data-slot="${slot}" data-part="${part.id}"${t ? ` transform="${t}"` : ''}`;
      return `<g ${attrs}>${inlineTokens(part.svg, colors)}</g>`;
    })
    .join('');
  const w = CANVAS_WIDTH * scale;
  const h = CANVAS_HEIGHT * scale;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">${body}</svg>`
  );
}
