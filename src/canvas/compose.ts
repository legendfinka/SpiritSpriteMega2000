import { getPart as registryGetPart } from '../parts/registry';
import type { Character, Expression, Part, Slot } from '../types';
import { LAYER_ORDER } from './layerOrder';

export interface Layer {
  slot: Slot;
  part: Part;
}

/** part ids per slot, with the expression's face swapped in */
export function resolvePartIds(
  character: Character,
  expression?: Expression,
): Partial<Record<Slot, string[]>> {
  const ids: Partial<Record<Slot, string[]>> = {};
  for (const slot of LAYER_ORDER) {
    const id = character.parts[slot];
    if (id) ids[slot] = [id];
  }
  if (expression) {
    ids.eyes = [expression.eyes];
    ids.brows = [expression.brows];
    ids.mouth = [expression.mouth];
    if (expression.extras) ids.extras = [...expression.extras];
  }
  return ids;
}

/** layers back to front; unknown ids are skipped so old saves still load */
export function composeLayers(
  character: Character,
  expression?: Expression,
  getPart: (id: string) => Part | undefined = registryGetPart,
): Layer[] {
  const ids = resolvePartIds(character, expression);
  const layers: Layer[] = [];
  for (const slot of LAYER_ORDER) {
    for (const id of ids[slot] ?? []) {
      const part = getPart(id);
      if (part) layers.push({ slot, part });
    }
  }
  return layers;
}

export function offsetTransform(part: Part): string | undefined {
  const { offset } = part;
  return offset && (offset.x || offset.y) ? `translate(${offset.x} ${offset.y})` : undefined;
}
