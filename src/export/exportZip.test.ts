import JSZip from 'jszip';
import { describe, expect, it, vi } from 'vitest';
import { PRESET_EXPRESSIONS } from '../expressions/presets';
import { createDefaultCharacter } from '../store/defaultCharacter';
import { characterFromJson } from './characterJson';
import { buildSpriteZip, type ExportOptions, exportFileNames, type Rasterize } from './exportZip';

// fake rasteriser: keeps the SVG text so we can check it
const fakeRasterize: Rasterize = async (svg) => new TextEncoder().encode(svg);

const character = { ...createDefaultCharacter(), name: 'Oleh' };
const expressions = [PRESET_EXPRESSIONS.neutral, PRESET_EXPRESSIONS.happy];
const options: ExportOptions = { scale: 1, format: 'png', includeJson: true };

async function unzip(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  return { zip, names: Object.keys(zip.files).sort() };
}

describe('buildSpriteZip', () => {
  it('contains one image per expression, the JSON and the README', async () => {
    const { names } = await unzip(
      await buildSpriteZip(character, expressions, options, fakeRasterize),
    );
    expect(names).toEqual(['README.txt', 'character.json', 'oleh happy.png', 'oleh neutral.png']);
    expect(names).toEqual([...exportFileNames(character, expressions, options)].sort());
  });

  it('rasterises scaled SVGs with every colour inlined', async () => {
    const { zip } = await unzip(
      await buildSpriteZip(character, expressions, { ...options, scale: 2 }, fakeRasterize),
    );
    const svg = await zip.file('oleh happy.png')!.async('string');
    expect(svg).toContain('width="1600" height="2160"');
    expect(svg).not.toContain('var(');
  });

  it('leaves out the JSON on request and uses the chosen format', async () => {
    const { names } = await unzip(
      await buildSpriteZip(
        character,
        expressions,
        { ...options, format: 'webp', includeJson: false },
        fakeRasterize,
      ),
    );
    expect(names).toEqual(['README.txt', 'oleh happy.webp', 'oleh neutral.webp']);
  });

  it('includes a re-importable character and a Ren\'Py README', async () => {
    const { zip } = await unzip(
      await buildSpriteZip(character, expressions, options, fakeRasterize),
    );
    expect(characterFromJson(await zip.file('character.json')!.async('string'))).toEqual(
      character,
    );
    const readme = await zip.file('README.txt')!.async('string');
    expect(readme).toContain('show oleh neutral');
    expect(readme).toContain('show oleh happy');
  });

  it('reports progress', async () => {
    const onProgress = vi.fn();
    await buildSpriteZip(character, expressions, options, fakeRasterize, onProgress);
    expect(onProgress.mock.calls).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });
});
