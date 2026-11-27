import { resolvePartIds } from '../canvas/compose';
import { SIDE_CROP, SIDE_ZOOM } from '../canvas/svgString';
import { t } from '../i18n';
import { findPart } from '../parts/customParts';
import type { Character, Expression, Slot } from '../types';
import { toImageTag } from './fileNames';

/** added by Ren'Py while the character speaks (config.speaking_attribute) */
export const TALKING = 'talking';

// eyes that are already shut, or would look odd blinking
const NO_BLINK = new Set([
  'eyes/closed-happy',
  'eyes/closed-calm',
  'eyes/wink',
  'eyes/dizzy',
  'eyes/hearts',
]);
export const BLINK_FRAME = 'eyes/closed-calm';
// mouth flap: alternate with an open mouth, or a closed one if it's already open
export const TALK_FRAME = 'mouth/open-o';
const TALK_FRAME_FOR_OPEN = 'mouth/neutral';

// words Ren'Py reads specially inside a layeredimage
const RESERVED_IDS = new Set([
  'always',
  'attribute',
  'auto',
  'default',
  'group',
  'multiple',
  'null',
  TALKING,
]);

/** one PNG in images/: name without extension, and the parts drawn into it */
export interface LayerImage {
  name: string;
  partIds: string[];
}

/** a layer, back to front: always drawn, or picked by expression */
export type Segment =
  | { kind: 'always'; image: LayerImage }
  | { kind: 'group'; slot: Slot; byExpression: [string, LayerImage[]][] };

export interface LayeredOptions {
  scale: number;
  sideImages: boolean;
  blinkTalk: boolean;
}

export interface LayeredPlan {
  tag: string;
  segments: Segment[];
  /** every PNG to export, once each */
  images: LayerImage[];
  /** the .rpy file */
  script: string;
}

export function layeredPlan(
  character: Character,
  expressions: readonly Expression[],
  { scale, sideImages, blinkTalk }: LayeredOptions,
): LayeredPlan {
  for (const { id } of expressions) {
    if (RESERVED_IDS.has(id)) {
      throw new Error(t('error.layeredName', { id }));
    }
  }

  const tag = toImageTag(character.name);
  const known = (ids: readonly string[] | undefined) =>
    (ids ?? []).filter((id) => findPart(character, id));
  const own = resolvePartIds(character);
  const images = new Map<string, LayerImage>();
  const image = (name: string, partIds: string[]): LayerImage => {
    let img = images.get(name);
    if (!img) images.set(name, (img = { name, partIds }));
    return img;
  };
  // "eyes/closed-happy" -> "mira_eyes_closed_happy"
  const partImage = (partId: string) => image(`${tag}_${partId.replace(/[/-]/g, '_')}`, [partId]);

  const segments: Segment[] = [];
  const always = (name: string, slots: Slot[]) => {
    const partIds = slots.flatMap((slot) => known(own[slot]));
    if (partIds.length === 0) return;
    segments.push({ kind: 'always', image: image(`${tag}_${name}`, partIds) });
  };
  const group = (slot: Slot, keep: (id: string) => boolean = () => true) => {
    const byExpression: [string, LayerImage[]][] = [];
    for (const expression of expressions) {
      const ids = known(resolvePartIds(character, expression)[slot]).filter(keep);
      if (ids.length > 0) byExpression.push([expression.id, ids.map(partImage)]);
    }
    if (byExpression.length > 0) segments.push({ kind: 'group', slot, byExpression });
  };

  // LAYER_ORDER, with neighbouring fixed slots merged into one image
  always('base', ['hairBack', 'body', 'bottom', 'top', 'outfit', 'face']);
  group('eyes');
  group('brows');
  always('hair', ['hairFront']);
  group('mouth');
  // the character's own marks (freckles) stay; expressions add theirs on top
  always('marks', ['extras']);
  const ownExtras = new Set(known(own.extras));
  group('extras', (id) => !ownExtras.has(id));
  always('accessory', ['accessory']);

  const defaultId = expressions.some((e) => e.id === 'neutral') ? 'neutral' : expressions[0]?.id;
  const lines = [
    `# Made with SpiritSprite Mega 2000. Images are in images/.`,
    `# Show it with: show ${tag} ${defaultId ?? ''}`.trimEnd(),
    '',
    `layeredimage ${tag}:`,
  ];
  const animations: string[] = [];
  const animated = new Set<string>();
  const animation = (name: string, body: string[]) => {
    if (animated.has(name)) return;
    animated.add(name);
    animations.push('', `image ${name}:`, ...body.map((l) => `    ${l}`));
  };

  for (const segment of segments) {
    if (segment.kind === 'always') {
      lines.push('    always:', `        "${segment.image.name}"`);
      continue;
    }
    lines.push(`    group ${segment.slot}:`);
    for (const [id, imgs] of segment.byExpression) {
      const head = `        attribute ${id}${id === defaultId ? ' default' : ''}:`;
      for (const img of imgs) {
        const partId = img.partIds[0] ?? '';
        if (blinkTalk && segment.slot === 'eyes' && !NO_BLINK.has(partId)) {
          const shut = partImage(BLINK_FRAME).name;
          // open for a random 2.5-5 s, shut for a moment
          animation(`${img.name}_blink`, [
            `"${img.name}"`,
            ...['2.5', '3.5', '5.0'].flatMap((t) => ['choice:', `    ${t}`]),
            `"${shut}"`,
            '0.12',
            'repeat',
          ]);
          lines.push(head, `            "${img.name}_blink"`);
        } else if (blinkTalk && segment.slot === 'mouth') {
          const open = partImage(partId === TALK_FRAME ? TALK_FRAME_FOR_OPEN : TALK_FRAME).name;
          animation(`${img.name}_talk`, [`"${open}"`, '0.12', `"${img.name}"`, '0.12', 'repeat']);
          lines.push(head, `            "${img.name}"`, `            if_not ["${TALKING}"]`);
          lines.push(head, `            "${img.name}_talk"`, `            if_any ["${TALKING}"]`);
        } else {
          lines.push(head, `            "${img.name}"`);
        }
      }
    }
  }
  // declared so Ren'Py knows the attribute; it draws nothing itself
  if (blinkTalk) lines.push(`    attribute ${TALKING} null`);
  lines.push(...animations);

  if (sideImages) {
    const crop = [SIDE_CROP.x, SIDE_CROP.y, SIDE_CROP.width, SIDE_CROP.height]
      .map((n) => Math.round(n * scale))
      .join(', ');
    lines.push(
      '',
      '# head and shoulders next to the textbox, with the same expression',
      `image side ${tag} = LayeredImageProxy("${tag}", Transform(crop=(${crop}), zoom=${SIDE_ZOOM}))`,
    );
  }
  if (blinkTalk) {
    lines.push(
      '',
      `# adds "${TALKING}" to the speaking character's image until their line is dismissed`,
      'init python:',
      `    config.speaking_attribute = "${TALKING}"`,
    );
  }

  return { tag, segments, images: [...images.values()], script: `${lines.join('\n')}\n` };
}
