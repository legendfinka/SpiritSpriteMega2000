// picked to match the body, plus names that fit either
const BY_BODY: Record<string, readonly string[]> = {
  'body/base-male': [
    'Artem', 'Bogdan', 'Denis', 'Egor', 'Fedya', 'Ilya', 'Kostya', 'Lev', 'Misha', 'Nikita',
    'Pasha', 'Roma', 'Stas', 'Taras', 'Tima', 'Vanya', 'Yura', 'Ben', 'Leo', 'Luca', 'Noah',
    'Theo',
  ],
  'body/base-female': [
    'Alina', 'Anya', 'Daria', 'Galya', 'Inna', 'Katya', 'Kira', 'Lena', 'Lida', 'Masha',
    'Nadya', 'Oksana', 'Olya', 'Polina', 'Sonya', 'Ulya', 'Vera', 'Yana', 'Chloe', 'Hana',
    'Maya', 'Nina', 'Zoe',
  ],
}; // prettier-ignore

const EITHER = ['Sasha', 'Zhenya', 'Alex', 'Sam', 'Kai', 'Rin', 'Jun', 'Yuki'];

/** a name that fits the body and differs from the current one */
export function randomName(body: string | undefined, current: string, random: () => number): string {
  const pool = [...(BY_BODY[body ?? ''] ?? []), ...EITHER].filter(
    (n) => n.toLowerCase() !== current.trim().toLowerCase(),
  );
  return pool[Math.floor(random() * pool.length)] ?? 'Sasha';
}

export const ALL_NAMES = [...Object.values(BY_BODY).flat(), ...EITHER];
