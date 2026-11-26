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

/**
 * paste-ready script that shows every expression.
 * `linkImage` adds image="<tag>", needed for side images and talking.
 */
export function renpySnippet(
  character: Character,
  expressions: readonly ExpressionId[],
  linkImage = false,
): string {
  const tag = toImageTag(character.name);
  const v = renpyVariable(character.name);
  const display = renpyString(character.name.trim() || tag);
  const image = linkImage ? `, image="${tag}"` : '';
  const lines = [`define ${v} = Character("${display}"${image})`, '', 'label start:'];
  for (const id of expressions) {
    lines.push(`    show ${tag} ${id}`, `    ${v} "This is me looking ${id}."`);
  }
  lines.push('    return');
  return lines.join('\n');
}

interface ReadmeOptions {
  mode: 'sprites' | 'layered';
  sideImages: boolean;
  blinkTalk: boolean;
}

export function readmeText(
  character: Character,
  expressions: readonly ExpressionId[],
  { mode, sideImages, blinkTalk }: ReadmeOptions,
): string {
  const tag = toImageTag(character.name);
  const layered = mode === 'layered';
  const talks = layered && blinkTalk;
  const install = layered
    ? [
        "1. Unzip everything into your project's game/ folder.",
        `   The parts go to game/images/, the layered image is ${tag}_layered.rpy.`,
        `   Don't keep old flat "${tag} ….png" sprites next to it.`,
      ]
    : [
        "1. Copy the image files into your project's game/images/ folder.",
        "   Ren'Py names them automatically from the file names.",
      ];
  const notes = [
    ...(sideImages
      ? [
          `Side images: the head shows next to the textbox while ${tag} speaks,`,
          '  with the same expression as the sprite.',
        ]
      : []),
    ...(talks
      ? [
          'Blink & talk: the eyes blink on their own. The mouth moves while the line is',
          '  on screen (config.speaking_attribute, set in the .rpy). It stops when the',
          "  player clicks, not when the text finishes. On a Ren'Py without that",
          '  setting the mouth just stays still.',
        ]
      : []),
  ];
  return [
    `SpiritSprite Mega 2000 — ${layered ? 'layered sprite' : 'sprites'} for "${character.name}"`,
    '',
    ...install,
    '2. Paste this into game/script.rpy:',
    '',
    renpySnippet(character, expressions, layered || sideImages),
    '',
    ...(notes.length > 0 ? [...notes, ''] : []),
    'character.json (if included) can be loaded back into SpiritSprite Mega 2000.',
    '',
  ].join('\n');
}
