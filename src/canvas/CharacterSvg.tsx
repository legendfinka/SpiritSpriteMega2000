import { type CSSProperties, useMemo } from 'react';
import type { Character, Expression } from '../types';
import { resolveColors, toCssVars } from './colors';
import { composeLayers } from './compose';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './svgString';

interface CharacterSvgProps {
  character: Character;
  expression?: Expression;
  className?: string;
  title?: string;
  /** crop in template coords, full canvas by default */
  viewBox?: string;
}

/** head crop for thumbnails */
export const HEAD_VIEWBOX = '200 40 400 400';

/** live preview; colours are CSS vars so recolouring is cheap (export uses renderSvgString) */
export function CharacterSvg({
  character,
  expression,
  className,
  title,
  viewBox = `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`,
}: CharacterSvgProps) {
  const layers = useMemo(() => composeLayers(character, expression), [character, expression]);
  const style = useMemo<CSSProperties>(
    () => toCssVars(resolveColors(character.colors)),
    [character.colors],
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className}
      style={style}
      role="img"
      aria-label={title ?? `${character.name} ${expression?.id ?? ''}`.trim()}
    >
      {layers.map(({ slot, part }, i) => (
        <g
          key={`${i}-${part.id}`}
          data-slot={slot}
          data-part={part.id}
          // our own bundled SVGs, safe to inject
          dangerouslySetInnerHTML={{ __html: part.svg }}
        />
      ))}
    </svg>
  );
}
