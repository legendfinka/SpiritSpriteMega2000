import { describe, expect, it } from 'vitest';
import { PRESET_EXPRESSIONS } from '../expressions/presets';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { renderPartsSvgString, renderSideSvgString, renderSvgString } from './svgString';

describe('renderSvgString', () => {
  const character = createDefaultCharacter();

  it.each(Object.values(PRESET_EXPRESSIONS))('leaves no var( in "$id"', (expr) => {
    expect(renderSvgString(character, expr)).not.toContain('var(');
  });

  it('is an 800x1080 document by default and scales the output size', () => {
    const svg = renderSvgString(character, PRESET_EXPRESSIONS.neutral);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="800" height="1080"/);
    expect(renderSvgString(character, PRESET_EXPRESSIONS.neutral, 2)).toContain(
      'width="1600" height="2160" viewBox="0 0 800 1080"',
    );
  });

  it('uses the character colours', () => {
    const svg = renderSvgString(
      { ...character, colors: { ...character.colors, hair: '#ff00ff' } },
      PRESET_EXPRESSIONS.neutral,
    );
    expect(svg).toContain('#ff00ff');
  });

  it('crops side images to head and shoulders', () => {
    expect(renderSideSvgString(character, PRESET_EXPRESSIONS.happy, 2)).toContain(
      'width="600" height="600" viewBox="160 0 480 480"',
    );
  });

  it('draws only the requested parts, in the given order, skipping unknown ones', () => {
    const svg = renderPartsSvgString(character, ['eyes/wide', 'nope/missing', 'body/base-male']);
    const parts = [...svg.matchAll(/data-part="([^"]+)"/g)].map((m) => m[1]);
    expect(parts).toEqual(['eyes/wide', 'body/base-male']);
    expect(svg).not.toContain('var(');
  });

  it('parses as SVG', () => {
    const doc = new DOMParser().parseFromString(
      renderSvgString(character, PRESET_EXPRESSIONS.happy),
      'image/svg+xml',
    );
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.tagName).toBe('svg');
  });
});
