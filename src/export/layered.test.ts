import { describe, expect, it } from 'vitest';
import { composeLayers } from '../canvas/compose';
import { listExpressions } from '../expressions/presets';
import { getPart } from '../parts/registry';
import { createDefaultCharacter } from '../store/defaultCharacter';
import type { Character, Expression } from '../types';
import { BLINK_FRAME, layeredPlan, type LayeredPlan, TALK_FRAME } from './layered';

const custom: Expression = {
  id: 'shy',
  eyes: 'eyes/half-lidded',
  brows: 'brows/sad',
  mouth: 'mouth/open-o',
  // freckles are the character's own, so they must not be drawn twice
  extras: ['extras/blush', 'extras/freckles'],
};

const base = createDefaultCharacter();
const character: Character = {
  ...base,
  name: 'Oleh',
  parts: { ...base.parts, extras: 'extras/freckles', accessory: 'accessories/round-glasses' },
  customExpressions: [custom],
};
const expressions = listExpressions(character);
const plan = (blinkTalk = true, sideImages = false, scale = 1) =>
  layeredPlan(character, expressions, { blinkTalk, sideImages, scale });

/** the parts a layeredimage shows for one attribute, back to front */
function shown(p: LayeredPlan, id: string): string[] {
  return p.segments.flatMap((s) =>
    s.kind === 'always'
      ? s.image.partIds
      : (s.byExpression.find(([e]) => e === id)?.[1] ?? []).flatMap((img) => img.partIds),
  );
}

describe('layeredPlan', () => {
  it('stacks exactly what the flat sprite draws, for every expression', () => {
    const p = plan(false);
    for (const e of expressions) {
      expect(shown(p, e.id), e.id).toEqual(composeLayers(character, e).map((l) => l.part.id));
    }
  });

  it('names every image after the tag, safe for Ren\'Py', () => {
    for (const img of plan().images) {
      expect(img.name).toMatch(/^oleh_[a-z0-9_]+$/);
      for (const id of img.partIds) expect(getPart(id), id).toBeDefined();
    }
  });

  it('only refers to images it exports or defines', () => {
    const p = plan();
    const exported = new Set(p.images.map((i) => i.name));
    const defined = new Set([...p.script.matchAll(/^image (\S+):$/gm)].map((m) => m[1]));
    const used = [...p.script.matchAll(/^ +"([a-z0-9_]+)"$/gm)].map((m) => m[1] ?? '');
    expect(used.length).toBeGreaterThan(0);
    for (const name of used) {
      expect(exported.has(name) || defined.has(name), name).toBe(true);
    }
  });

  it('blinks open eyes, leaves shut ones, and flaps every mouth while talking', () => {
    const { script } = plan();
    expect(script).toContain('"oleh_eyes_normal_blink"');
    expect(script).not.toContain('oleh_eyes_closed_happy_blink');
    expect(script).toContain('if_not ["talking"]');
    expect(script).toContain('"oleh_mouth_smile_talk"');
    // an open mouth flaps to a closed one instead
    expect(script).toMatch(/image oleh_mouth_open_o_talk:\n {4}"oleh_mouth_neutral"/);
    expect(script).toContain('    attribute talking null');
    expect(script).toContain('config.speaking_attribute = "talking"');
  });

  it('exports blink and talk frames only when they are used', () => {
    const names = (p: LayeredPlan) => p.images.map((i) => i.partIds[0]);
    expect(names(plan(true))).toEqual(expect.arrayContaining([BLINK_FRAME, TALK_FRAME]));
    const still = plan(false);
    expect(still.script).not.toContain('talking');
    expect(still.script).not.toContain('_blink');
    expect(names(still)).not.toContain(BLINK_FRAME);
  });

  it('makes neutral the default in each group', () => {
    const defaults = [...plan(false).script.matchAll(/attribute (\w+) default:/g)].map((m) => m[1]);
    expect(new Set(defaults)).toEqual(new Set(['neutral']));
  });

  it('adds a side image proxy cropped at the export scale', () => {
    expect(plan(false, true, 2).script).toContain(
      'image side oleh = LayeredImageProxy("oleh", Transform(crop=(320, 0, 960, 960), zoom=0.625))',
    );
    expect(plan(false, false).script).not.toContain('image side');
  });

  it('indents with four spaces only', () => {
    for (const line of plan(true, true).script.split('\n')) {
      expect(line, line).toMatch(/^( {4})*\S|^$/);
    }
  });

  it('refuses expression names Ren\'Py reads as keywords', () => {
    const bad = { ...custom, id: 'default' };
    expect(() =>
      layeredPlan(character, [bad], { blinkTalk: false, sideImages: false, scale: 1 }),
    ).toThrow('Rename the “default” expression');
  });
});
