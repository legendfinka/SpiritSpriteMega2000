import { isHex } from '../canvas/colors';
import { LAYER_ORDER } from '../canvas/layerOrder';
import { expressionNameError } from '../expressions/names';
import { CUSTOM_ID_RE, MAX_CUSTOM_PARTS } from '../parts/customParts';
import { OUTFIT_SPLITS } from '../parts/outfitSplits';
import { MAX_PART_SVG_LENGTH, sanitizeFragment } from '../parts/sanitizeSvg';
import type { Character, Expression, Part, Slot } from '../types';

const MAX_CHARACTER_NAME = 100;
// control characters, plus unicode line (Zl) and paragraph (Zp) separators
const LINE_BREAKS = /[\p{Cc}\p{Zl}\p{Zp}]+/gu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function isExpression(value: unknown): value is Expression {
  if (!isRecord(value)) return false;
  const { id, eyes, brows, mouth, extras } = value;
  return (
    // ids become file names and Ren'Py code, so nothing odd gets in
    typeof id === 'string' &&
    expressionNameError(id, []) === null &&
    typeof eyes === 'string' &&
    typeof brows === 'string' &&
    typeof mouth === 'string' &&
    (extras === undefined || isStringArray(extras))
  );
}

/** saves from before tops and bottoms: two-piece outfits become a top + bottom */
function splitOldOutfit(parts: Character['parts']): Character['parts'] {
  const split = parts.outfit ? OUTFIT_SPLITS[parts.outfit] : undefined;
  if (!split) return parts;
  const next = { ...parts, ...split };
  delete next.outfit;
  return next;
}

/** uploaded parts from a save or a stranger's link: svg is sanitised again, never trusted */
function parseCustomParts(value: unknown): Part[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_CUSTOM_PARTS) return null;
  const parts: Part[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const { id, slot, label, svg } = item;
    if (
      typeof id !== 'string' ||
      !CUSTOM_ID_RE.test(id) ||
      parts.some((p) => p.id === id) ||
      typeof slot !== 'string' ||
      !(LAYER_ORDER as readonly string[]).includes(slot) ||
      typeof label !== 'string' ||
      typeof svg !== 'string' ||
      svg.length > MAX_PART_SVG_LENGTH
    ) {
      return null;
    }
    try {
      parts.push({
        id,
        slot: slot as Slot,
        label: label.replace(LINE_BREAKS, ' ').slice(0, 40),
        svg: sanitizeFragment(svg),
      });
    } catch {
      return null;
    }
  }
  return parts;
}

/** checks saved/imported data and fills newer fields; null if it's junk */
export function parseCharacter(value: unknown): Character | null {
  if (!isRecord(value)) return null;
  const { name, parts, colors, expressions, customExpressions = [], version } = value;
  const customParts = parseCustomParts(value.customParts);
  if (
    customParts === null ||
    version !== 1 ||
    typeof name !== 'string' ||
    !isRecord(parts) ||
    !Object.values(parts).every((id) => typeof id === 'string') ||
    !isRecord(colors) ||
    !Object.values(colors).every((hex) => typeof hex === 'string' && isHex(hex)) ||
    !isStringArray(expressions) ||
    !Array.isArray(customExpressions) ||
    !customExpressions.every(isExpression)
  ) {
    return null;
  }
  return {
    // the name gets pasted into a Ren'Py script, so keep it on one line
    name: name.replace(LINE_BREAKS, ' ').slice(0, MAX_CHARACTER_NAME),
    parts: splitOldOutfit(parts as Character['parts']),
    colors: colors as Character['colors'],
    expressions,
    customExpressions,
    // left out when empty, so older saves round-trip unchanged
    ...(customParts.length > 0 ? { customParts } : {}),
    version,
  };
}
