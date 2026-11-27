import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../canvas/svgString';
import { t } from '../i18n';
import { COLOR_TOKENS } from '../types';

/*
 * Uploaded parts end up in the page via innerHTML and travel in share links, so they
 * are rebuilt from an allowlist instead of filtered: plain shapes only, known
 * attributes only, every value checked against a strict pattern. No scripts, links,
 * styles, text, images or url() can survive, because nothing unknown is copied.
 */

export class SvgPartError extends Error {}

export const MAX_SVG_FILE_BYTES = 300_000;
export const MAX_PART_SVG_LENGTH = 150_000;
const MAX_ELEMENTS = 5_000;

const SVG_NS = 'http://www.w3.org/2000/svg';
const SHAPES = new Set(['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);
// editor leftovers that are fine to drop without mentioning (empty <defs> too)
const SILENT = new Set(['title', 'desc', 'metadata', 'namedview']);
const TOKENS = new Set<string>(COLOR_TOKENS);

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?(px)?$/i;
const NUMBER_LIST = /^[\d\s.,eE+-]+$/;
const PATH_DATA = /^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]*$/;
const TRANSFORM = /^\s*((matrix|translate|scale|rotate|skewX|skewY)\s*\([\d\s.,eE+-]*\)[\s,]*)+$/;
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
const VAR = /^var\(\s*--([a-z-]+)\s*(,[^()]*)?\)$/;

type Check = (value: string) => string | null;

const pattern =
  (re: RegExp): Check =>
  (v) =>
    re.test(v) ? v : null;
const oneOf =
  (...allowed: string[]): Check =>
  (v) =>
    allowed.includes(v) ? v : null;

function color(raw: string): string | null {
  const v = raw.toLowerCase();
  if (v === 'none' || HEX.test(v)) return v;
  if (v === 'black') return '#000000';
  if (v === 'white') return '#ffffff';
  const rgb = RGB.exec(v);
  if (rgb) {
    const hex = rgb.slice(1, 4).map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0'));
    return `#${hex.join('')}`;
  }
  const token = VAR.exec(v);
  if (token) {
    const name = token[1] ?? '';
    if (!TOKENS.has(name)) throw new SvgPartError(t('error.svgToken', { name }));
    return `var(--${name})`;
  }
  return null;
}

function opacity(v: string): string | null {
  if (NUMBER.test(v)) return v;
  const percent = /^(\d+(\.\d+)?)%$/.exec(v);
  return percent ? String(Number(percent[1]) / 100) : null;
}

const number = pattern(NUMBER);

const ATTRIBUTES: Record<string, Check> = {
  d: pattern(PATH_DATA),
  points: pattern(NUMBER_LIST),
  transform: pattern(TRANSFORM),
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  width: number,
  height: number,
  fill: color,
  stroke: color,
  'stroke-width': number,
  'stroke-miterlimit': number,
  'stroke-dashoffset': number,
  'stroke-dasharray': (v) => (v === 'none' || NUMBER_LIST.test(v) ? v : null),
  'stroke-linecap': oneOf('butt', 'round', 'square'),
  'stroke-linejoin': oneOf('miter', 'round', 'bevel', 'miter-clip', 'arcs'),
  'fill-rule': oneOf('nonzero', 'evenodd'),
  'clip-rule': oneOf('nonzero', 'evenodd'),
  'paint-order': pattern(/^(normal|((fill|stroke|markers)\s*){1,3})$/),
  opacity,
  'fill-opacity': opacity,
  'stroke-opacity': opacity,
};

// attributes that never matter for drawing; dropped without counting
const IGNORED_ATTRIBUTE = /^(id|class|xmlns(:.*)?|version|data-.*|.*:.*)$/;

const escape = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Walk {
  removed: number;
  elements: number;
}

/** allowed attributes from the element and its style="" */
function cleanAttributes(el: Element, walk: Walk): string {
  const found = new Map<string, string>();
  const consider = (name: string, raw: string) => {
    const check = ATTRIBUTES[name];
    if (!check) {
      if (!IGNORED_ATTRIBUTE.test(name)) walk.removed++;
      return;
    }
    const value = check(raw.trim().replace(/\s*!important$/, ''));
    if (value === null) walk.removed++;
    else found.set(name, value);
  };
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'style') {
      for (const decl of attr.value.split(';')) {
        const i = decl.indexOf(':');
        if (i > 0) consider(decl.slice(0, i).trim().toLowerCase(), decl.slice(i + 1));
      }
    } else if (attr.name !== 'viewBox') {
      consider(attr.name, attr.value);
    }
  }
  return [...found].map(([k, v]) => ` ${k}="${escape(v)}"`).join('');
}

function cleanChildren(parent: Element, walk: Walk): string {
  let out = '';
  for (const child of Array.from(parent.children)) {
    if (++walk.elements > MAX_ELEMENTS) throw new SvgPartError(t('error.svgShapes'));
    const name = child.localName;
    if (child.namespaceURI !== SVG_NS || !SHAPES.has(name)) {
      const empty = name === 'defs' && child.children.length === 0;
      if (!SILENT.has(name) && !empty) walk.removed++;
      continue;
    }
    const inner = cleanChildren(child, walk);
    const attrs = cleanAttributes(child, walk);
    out += inner ? `<${name}${attrs}>${inner}</${name}>` : `<${name}${attrs}/>`;
  }
  return out;
}

function size(root: Element): [number, number] | null {
  const box = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (box && box.length === 4 && box.every(Number.isFinite)) {
    if (box[0] !== 0 || box[1] !== 0) return null;
    return [box[2] ?? 0, box[3] ?? 0];
  }
  const w = parseFloat(root.getAttribute('width') ?? '');
  const h = parseFloat(root.getAttribute('height') ?? '');
  return Number.isFinite(w) && Number.isFinite(h) ? [w, h] : null;
}

export interface SanitizedPart {
  /** inner SVG, like the bundled part fragments */
  svg: string;
  /** things left out: text, images, gradients, unknown attributes… */
  removed: number;
}

/** checks a whole uploaded .svg file; throws SvgPartError with a message for the user */
export function sanitizeSvgFile(text: string): SanitizedPart {
  if (text.length > MAX_SVG_FILE_BYTES) throw new SvgPartError(t('error.svgBig'));
  const parse = (source: string) => new DOMParser().parseFromString(source, 'image/svg+xml');
  let doc = parse(text);
  // hand-written files often skip xmlns; without it nothing parses as SVG
  if (doc.documentElement.localName === 'svg' && doc.documentElement.namespaceURI === null) {
    doc = parse(text.replace(/<svg\b/, `<svg xmlns="${SVG_NS}"`));
  }
  const root = doc.documentElement;
  if (
    doc.getElementsByTagName('parsererror').length > 0 ||
    root.localName !== 'svg' ||
    root.namespaceURI !== SVG_NS
  ) {
    throw new SvgPartError(t('error.svgNot'));
  }
  const dims = size(root);
  if (!dims || dims[0] !== CANVAS_WIDTH || dims[1] !== CANVAS_HEIGHT) {
    const size = `${CANVAS_WIDTH}×${CANVAS_HEIGHT}`;
    throw new SvgPartError(
      dims
        ? t('error.svgCanvasGot', { size, got: `${dims[0]}×${dims[1]}` })
        : t('error.svgCanvas', { size }),
    );
  }

  const walk: Walk = { removed: 0, elements: 0 };
  const inner = cleanChildren(root, walk);
  // root-level fill="none" etc. (Figma) still applies to everything inside
  const rootAttrs = cleanAttributes(root, walk).replace(/ (width|height)="[^"]*"/g, '');
  const svg = rootAttrs && inner ? `<g${rootAttrs}>${inner}</g>` : inner;
  if (!svg) throw new SvgPartError(t('error.svgEmpty'));
  if (svg.length > MAX_PART_SVG_LENGTH) throw new SvgPartError(t('error.svgDetailed'));
  return { svg, removed: walk.removed };
}

/** re-checks a stored part (saves, share links); same rules */
export function sanitizeFragment(fragment: string): string {
  const wrapped = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}">${fragment}</svg>`;
  return sanitizeSvgFile(wrapped).svg;
}
