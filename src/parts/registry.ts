import type { Part, Slot } from '../types';

/** folder -> slot */
export const FOLDER_SLOTS: Record<string, Slot> = {
  body: 'body',
  outfit: 'outfit',
  'hair-back': 'hairBack',
  face: 'face',
  eyes: 'eyes',
  brows: 'brows',
  mouth: 'mouth',
  'hair-front': 'hairFront',
  extras: 'extras',
  accessories: 'accessory',
};

// the only place part files get imported
const files = import.meta.glob<string>('./*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function toLabel(fileName: string): string {
  const words = fileName.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** drops the <svg> wrapper and colour fallbacks, they're only for editor previews */
export function toFragment(file: string): string {
  const inner = /<svg\b[^>]*>([\s\S]*)<\/svg>/.exec(file)?.[1];
  if (inner === undefined) throw new Error('Part file has no <svg> wrapper');
  return inner.replace(/var\(\s*(--[a-z0-9-]+)\s*,[^)]*\)/gi, 'var($1)').trim();
}

function buildParts(): Part[] {
  const parts: Part[] = [];
  for (const [path, svg] of Object.entries(files)) {
    const match = /^\.\/([^/]+)\/([^/]+)\.svg$/.exec(path);
    if (!match) continue;
    const [, folder = '', fileName = ''] = match;
    const slot = FOLDER_SLOTS[folder];
    if (!slot) throw new Error(`Part folder "${folder}" is not mapped to a slot`);
    parts.push({ id: `${folder}/${fileName}`, slot, label: toLabel(fileName), svg: toFragment(svg) });
  }
  return parts.sort((a, b) => a.id.localeCompare(b.id));
}

export const PARTS: readonly Part[] = buildParts();

const byId = new Map(PARTS.map((p) => [p.id, p]));

export function getPart(id: string): Part | undefined {
  return byId.get(id);
}

export function partsForSlot(slot: Slot): Part[] {
  return PARTS.filter((p) => p.slot === slot);
}
