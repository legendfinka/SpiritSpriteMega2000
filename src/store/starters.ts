import type { Character } from '../types';
import { createDefaultCharacter } from './defaultCharacter';

// ready-made characters to start from, built only from bundled parts
const build = (
  name: string,
  parts: Character['parts'],
  colors: Character['colors'],
): Character => ({ ...createDefaultCharacter(), name, parts, colors });

const face = { eyes: 'eyes/normal', brows: 'brows/neutral', mouth: 'mouth/neutral' };

export const STARTERS: readonly { id: string; label: string; create: () => Character }[] = [
  { id: 'guy', label: 'Guy in a jacket', create: createDefaultCharacter },
  {
    id: 'mira',
    label: 'Girl in a dress',
    create: () =>
      build(
        'mira',
        {
          body: 'body/base-female',
          outfit: 'outfit/dress',
          hairBack: 'hair-back/long',
          face: 'face/soft',
          hairFront: 'hair-front/blunt-bangs',
          ...face,
        },
        {
          skin: '#f6d5bb',
          hair: '#2e2a36',
          iris: '#7a4b2e',
          'outfit-main': '#b8432b',
          'outfit-accent': '#f7eedb',
          pants: '#3e5f8f',
          outline: '#2b1d18',
        },
      ),
  },
  {
    id: 'vika',
    label: 'Student with glasses',
    create: () =>
      build(
        'vika',
        {
          body: 'body/base-female',
          outfit: 'outfit/school-uniform',
          hairBack: 'hair-back/ponytail',
          face: 'face/soft',
          hairFront: 'hair-front/side-swept',
          accessory: 'accessories/round-glasses',
          ...face,
        },
        {
          skin: '#f4cfae',
          hair: '#c98a3e',
          iris: '#2f7d77',
          'outfit-main': '#2c3e57',
          'outfit-accent': '#f7f1e3',
          pants: '#4a4f5e',
          outline: '#2b1d18',
        },
      ),
  },
  {
    id: 'sasha',
    label: 'Sporty, 90s tracksuit',
    create: () =>
      build(
        'sasha',
        {
          body: 'body/base-male',
          outfit: 'outfit/tracksuit',
          face: 'face/oval',
          hairFront: 'hair-front/buzz',
          accessory: 'accessories/cap',
          ...face,
          brows: 'brows/thick',
        },
        {
          skin: '#e8b98f',
          hair: '#3a2a1e',
          iris: '#5a4632',
          'outfit-main': '#3a3f8f',
          'outfit-accent': '#f7eedb',
          pants: '#3a3f8f',
          outline: '#2b1d18',
        },
      ),
  },
  {
    id: 'kostya',
    label: 'Cozy sweater, headphones',
    create: () =>
      build(
        'kostya',
        {
          body: 'body/base-male',
          outfit: 'outfit/sweater-jeans',
          hairBack: 'hair-back/short',
          face: 'face/oval',
          hairFront: 'hair-front/curtains',
          accessory: 'accessories/headphones',
          ...face,
        },
        {
          skin: '#f4cfae',
          hair: '#8a5a32',
          iris: '#4f7fb8',
          'outfit-main': '#9c2f2a',
          'outfit-accent': '#ece4d0',
          pants: '#3e5f8f',
          outline: '#2b1d18',
        },
      ),
  },
];
