import type { Part, Slot } from '../types';

/** Folder name under src/parts/ -> slot. */
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

// The only place part files are imported (see CLAUDE.md §9).
const files = import.meta.glob<string>('./*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function toLabel(fileName: string): string {
  const words = fileName.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Part files are standalone SVGs with fallback colours so editors can preview them.
 * The app needs only the inner fragment with bare var(--token) references.
 */
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
