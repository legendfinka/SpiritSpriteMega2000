import type { Character, ExpressionId } from '../types';
import { toImageTag } from './fileNames';

// names that can't be a `define` variable
const RESERVED = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif',
  'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda',
  'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'at', 'behind', 'call', 'camera', 'config', 'default', 'define', 'expression', 'extend',
  'hide', 'image', 'init', 'jump', 'label', 'layeredimage', 'menu', 'nvl', 'onlayer', 'pause',
  'persistent', 'play', 'python', 'queue', 'renpy', 'scene', 'screen', 'show', 'stop', 'store',
  'style', 'transform', 'translate', 'voice', 'window', 'with', 'zorder',
]); // prettier-ignore

/** speaker variable, e.g. "oleh" */
export function renpyVariable(name: string): string {
  const tag = toImageTag(name);
  return RESERVED.has(tag) ? `${tag}_char` : tag;
}

/** escape for a Ren'Py string, [ and { too */
function renpyString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\[/g, '[[').replace(/\{/g, '{{');
}

/** paste-ready script that shows every expression */
export function renpySnippet(character: Character, expressions: readonly ExpressionId[]): string {
  const tag = toImageTag(character.name);
  const v = renpyVariable(character.name);
  const display = renpyString(character.name.trim() || tag);
  const lines = [`define ${v} = Character("${display}")`, '', 'label start:'];
  for (const id of expressions) {
    lines.push(`    show ${tag} ${id}`, `    ${v} "This is me looking ${id}."`);
  }
  lines.push('    return');
  return lines.join('\n');
}

export function readmeText(character: Character, expressions: readonly ExpressionId[]): string {
  return [
    `SpiritSprite Mega 2000 — sprites for "${character.name}"`,
    '',
    '1. Copy the image files into your project\'s game/images/ folder.',
    '   Ren\'Py names them automatically from the file names.',
    '2. Paste this into game/script.rpy:',
    '',
    renpySnippet(character, expressions),
    '',
    'character.json (if included) can be loaded back into SpiritSprite Mega 2000.',
    '',
  ].join('\n');
}
