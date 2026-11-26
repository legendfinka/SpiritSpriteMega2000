import type { Hex } from '../types';
import type { BaseToken } from './colors';

export interface Swatch {
  label: string;
  /** base colours it sets; shades follow automatically */
  colors: Partial<Record<BaseToken, Hex>>;
}

const single = (token: BaseToken, list: [string, Hex][]): Swatch[] =>
  list.map(([label, hex]) => ({ label, colors: { [token]: hex } }));

const outfit = (label: string, main: Hex, accent: Hex, pants: Hex): Swatch => ({
  label,
  colors: { 'outfit-main': main, 'outfit-accent': accent, pants },
});

export const SKIN_SWATCHES = single('skin', [
  ['Porcelain', '#f8dcc4'],
  ['Fair', '#f4cfae'],
  ['Warm', '#e8b98f'],
  ['Tan', '#c99068'],
  ['Brown', '#9c6644'],
  ['Deep', '#6e4530'],
]);

export const HAIR_SWATCHES = single('hair', [
  ['Black', '#1f1b1d'],
  ['Dark brown', '#3a2a1e'],
  ['Chestnut', '#6b4428'],
  ['Ginger', '#b5532e'],
  ['Blonde', '#e8c46a'],
  ['Silver', '#c9c5bd'],
  ['Pink', '#d97a9a'],
  ['Teal', '#2f7d77'],
]);

export const IRIS_SWATCHES = single('iris', [
  ['Blue', '#4f7fb8'],
  ['Green', '#4f8a5b'],
  ['Hazel', '#8a6a32'],
  ['Brown', '#5a4632'],
  ['Grey', '#6f7c86'],
  ['Violet', '#7a58a8'],
]);

export const OUTFIT_SWATCHES: Swatch[] = [
  outfit('Teal and denim', '#2f6f6a', '#ece4d0', '#3e5f8f'),
  outfit('Brick', '#9c2f2a', '#ece4d0', '#3e5f8f'),
  outfit('Mustard', '#e3a92b', '#f7eedb', '#4f7fb8'),
  outfit('Navy', '#2c3e57', '#f7f7f2', '#4a4f5e'),
  outfit('Tracksuit', '#3a3f8f', '#f7eedb', '#3a3f8f'),
  outfit('Night', '#26222a', '#f7f7f2', '#3b4250'),
  outfit('Olive', '#6b7340', '#e6d9bd', '#4a3f33'),
  outfit('Candy', '#d97a9a', '#fff3e6', '#7a58a8'),
];

export const SWATCHES: Partial<Record<BaseToken, Swatch[]>> = {
  skin: SKIN_SWATCHES,
  hair: HAIR_SWATCHES,
  iris: IRIS_SWATCHES,
  'outfit-main': OUTFIT_SWATCHES,
};
