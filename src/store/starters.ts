import type { Character } from '../types';
import { createDefaultCharacter } from './defaultCharacter';

// ready-made characters, built only from bundled parts. Each lists what differs from
// the default: the calm face and colours fill in the rest. Labels live in i18n.
const build = (
  name: string,
  parts: Character['parts'],
  colors: Character['colors'],
): (() => Character) => {
  return () => {
    const base = createDefaultCharacter();
    const { eyes, brows, mouth } = base.parts;
    return {
      ...base,
      name,
      parts: { eyes, brows, mouth, ...parts },
      colors: { ...base.colors, ...colors },
    };
  };
};

export const STARTERS: readonly { id: string; create: () => Character }[] = [
  { id: 'guy', create: createDefaultCharacter },
  {
    id: 'mira',
    create: build(
      'mira',
      {
        body: 'body/base-female',
        outfit: 'outfit/dress',
        hairBack: 'hair-back/long',
        face: 'face/soft',
        hairFront: 'hair-front/blunt-bangs',
      },
      { skin: '#f6d5bb', hair: '#2e2a36', iris: '#7a4b2e', 'outfit-main': '#b8432b', 'outfit-accent': '#f7eedb' },
    ),
  },
  {
    id: 'vika',
    create: build(
      'vika',
      {
        body: 'body/base-female',
        top: 'top/blazer',
        bottom: 'bottom/pleated-skirt',
        hairBack: 'hair-back/ponytail',
        face: 'face/soft',
        hairFront: 'hair-front/side-swept',
        accessory: 'accessories/round-glasses',
      },
      { hair: '#c98a3e', iris: '#2f7d77', 'outfit-main': '#2c3e57', 'outfit-accent': '#f7f1e3', pants: '#4a4f5e' },
    ),
  },
  {
    id: 'sasha',
    create: build(
      'sasha',
      {
        body: 'body/base-male',
        outfit: 'outfit/tracksuit',
        face: 'face/oval',
        hairFront: 'hair-front/buzz',
        accessory: 'accessories/cap',
        brows: 'brows/thick',
      },
      { skin: '#e8b98f', hair: '#3a2a1e', iris: '#5a4632', 'outfit-main': '#3a3f8f', 'outfit-accent': '#f7eedb', pants: '#3a3f8f' },
    ),
  },
  {
    id: 'kostya',
    create: build(
      'kostya',
      {
        body: 'body/base-male',
        top: 'top/knit-sweater',
        bottom: 'bottom/jeans',
        hairBack: 'hair-back/short',
        face: 'face/oval',
        hairFront: 'hair-front/curtains',
        accessory: 'accessories/headphones',
      },
      { hair: '#8a5a32', 'outfit-main': '#9c2f2a' },
    ),
  },
  {
    id: 'lena',
    create: build(
      'lena',
      {
        body: 'body/base-female',
        outfit: 'outfit/sailor-uniform',
        hairBack: 'hair-back/twin-tails',
        face: 'face/soft',
        hairFront: 'hair-front/blunt-bangs',
        accessory: 'accessories/hair-bow',
        eyes: 'eyes/sparkly',
      },
      { skin: '#f8dcc4', hair: '#e8c46a', iris: '#3f6fb5', 'outfit-main': '#2c3e57', 'outfit-accent': '#f7f7f2', pants: '#b8432b' },
    ),
  },
  {
    id: 'dima',
    create: build(
      'dima',
      {
        body: 'body/base-male',
        top: 'top/leather-jacket',
        bottom: 'bottom/jeans',
        hairBack: 'hair-back/short',
        face: 'face/sharp',
        hairFront: 'hair-front/pompadour',
        accessory: 'accessories/sunglasses',
        mouth: 'mouth/smirk',
      },
      { skin: '#eac2a0', hair: '#1f1b1d', iris: '#5a4632', 'outfit-main': '#26222a', 'outfit-accent': '#f7f7f2', pants: '#3b4250', outline: '#1a1416' },
    ),
  },
  {
    id: 'zoya',
    create: build(
      'zoya',
      {
        body: 'body/base-female',
        outfit: 'outfit/overalls',
        hairBack: 'hair-back/braid',
        face: 'face/round',
        hairFront: 'hair-front/wavy',
        accessory: 'accessories/beanie',
        extras: 'extras/freckles',
      },
      { hair: '#b5532e', iris: '#4f8a5b', 'outfit-main': '#e3a92b', 'outfit-accent': '#f7eedb', pants: '#4f7fb8' },
    ),
  },
]; // prettier-ignore
