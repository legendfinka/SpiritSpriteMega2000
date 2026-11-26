import { describe, expect, it } from 'vitest';
import { partsForSlot } from '../parts/registry';
import type { Character, Part, Slot } from '../types';
import { composeLayers } from './compose';
import { LAYER_ORDER, layerIndex } from './layerOrder';

// tsc fails here if a new Slot isn't listed
const ALL_SLOTS: Record<Slot, true> = {
  body: true,
  outfit: true,
  hairBack: true,
  face: true,
  eyes: true,
  brows: true,
  mouth: true,
  hairFront: true,
  extras: true,
  accessory: true,
};

// any "stub/<slot>" resolves, even slots with no art yet
function stubPart(id: string): Part | undefined {
  const slot = id.replace(/^stub\//, '');
  return slot in ALL_SLOTS ? { id, slot: slot as Slot, label: slot, svg: '' } : undefined;
}

function character(parts: Character['parts']): Character {
  return { name: 't', parts, colors: {}, expressions: [], customExpressions: [], version: 1 };
}

describe('LAYER_ORDER', () => {
  it('lists every slot exactly once', () => {
    expect([...LAYER_ORDER].sort()).toEqual(Object.keys(ALL_SLOTS).sort());
  });

  it('draws brows under the front hair', () => {
    expect(layerIndex('brows')).toBeLessThan(layerIndex('hairFront'));
  });
});

describe('composeLayers', () => {
  it('respects layer order for every slot combination', () => {
    const n = LAYER_ORDER.length;
    for (let mask = 1; mask < 1 << n; mask++) {
      const slots = LAYER_ORDER.filter((_, i) => mask & (1 << i));
      // reversed so key order can't fake a pass
      const parts: Character['parts'] = {};
      for (const slot of [...slots].reverse()) parts[slot] = `stub/${slot}`;
      const drawn = composeLayers(character(parts), undefined, stubPart).map((l) => l.slot);
      expect(drawn).toEqual(slots);
    }
  });

  it('lets an expression override the face slots only', () => {
    const base = character({
      body: 'body/base-male',
      face: 'face/oval',
      eyes: 'eyes/normal',
      brows: 'brows/neutral',
      mouth: 'mouth/neutral',
      hairFront: 'hair-front/messy-fringe',
    });
    const layers = composeLayers(base, {
      id: 'custom',
      eyes: 'eyes/wide',
      brows: 'brows/angry',
      mouth: 'mouth/open-o',
      extras: ['extras/blush', 'extras/sweat-drop'],
    });
    const bySlot = (slot: Slot) => layers.filter((l) => l.slot === slot).map((l) => l.part.id);
    expect(bySlot('eyes')).toEqual(['eyes/wide']);
    expect(bySlot('brows')).toEqual(['brows/angry']);
    expect(bySlot('mouth')).toEqual(['mouth/open-o']);
    expect(bySlot('extras')).toEqual(['extras/blush', 'extras/sweat-drop']);
    expect(bySlot('body')).toEqual(['body/base-male']);
    expect(bySlot('hairFront')).toEqual(['hair-front/messy-fringe']);
  });

  it('skips unknown part ids instead of throwing', () => {
    const c = character({ body: 'body/base-male', hairFront: 'hair-front/does-not-exist' });
    expect(composeLayers(c).map((l) => l.slot)).toEqual(['body']);
  });

  it('has real art for every slot', () => {
    for (const slot of LAYER_ORDER) {
      expect(partsForSlot(slot).length, slot).toBeGreaterThan(0);
    }
  });
});
