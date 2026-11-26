import { useMemo } from 'react';
import { CharacterSvg, HEAD_VIEWBOX } from '../canvas/CharacterSvg';
import { createDefaultCharacter } from '../store/defaultCharacter';
import type { Character, Part } from '../types';
import styles from './PartPicker.module.css';
import { FULL_BODY_SLOTS } from './slots';

interface PartThumbnailProps {
  part: Part;
  colors: Character['colors'];
}

/** part on the default guy, in the user's colours */
export function PartThumbnail({ part, colors }: PartThumbnailProps) {
  const character = useMemo<Character>(() => {
    const base = createDefaultCharacter();
    const parts = { ...base.parts, [part.slot]: part.id };
    // bodies all look alike under a jacket
    if (part.slot === 'body') delete parts.outfit;
    return { ...base, parts, colors };
  }, [part, colors]);

  return (
    <span aria-hidden="true">
      <CharacterSvg
        character={character}
        viewBox={FULL_BODY_SLOTS.includes(part.slot) ? undefined : HEAD_VIEWBOX}
        className={styles.thumbSvg}
      />
    </span>
  );
}
