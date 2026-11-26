import { useState } from 'react';
import { CharacterSvg } from '../canvas/CharacterSvg';
import type { Character, Expression } from '../types';
import styles from './Stage.module.css';

const BASE = import.meta.env.BASE_URL;

const BACKGROUNDS = [
  { id: 'room', label: 'Room' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'courtyard', label: 'Courtyard' },
  { id: 'classroom', label: 'Classroom' },
  { id: 'rooftop', label: 'Rooftop at night' },
] as const;

type View = 'sprite' | 'scene';
type BackgroundId = (typeof BACKGROUNDS)[number]['id'];
type ScenePosition = 'left' | 'center' | 'right';

// Ren'Py's left/center/right on a 1920 wide screen, sprite is 800 wide
const SCENE_LEFT: Record<ScenePosition, string> = {
  left: '0%',
  center: `${((1920 - 800) / 2 / 1920) * 100}%`,
  right: `${((1920 - 800) / 1920) * 100}%`,
};

interface StageProps {
  character: Character;
  expression: Expression;
}

export function Stage({ character, expression }: StageProps) {
  const [view, setView] = useState<View>('sprite');
  const [background, setBackground] = useState<BackgroundId>('room');
  const [position, setPosition] = useState<ScenePosition>('center');
  const [showGuide, setShowGuide] = useState(false);

  const sprite = (
    <CharacterSvg
      character={character}
      expression={expression}
      className={styles.sprite}
      title="Preview"
    />
  );

  return (
    <div className={styles.stage}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label="View">
          {(['sprite', 'scene'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>

        {view === 'sprite' ? (
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={showGuide}
              onChange={(e) => setShowGuide(e.target.checked)}
            />
            Guide
          </label>
        ) : (
          <>
            <label className={styles.option}>
              Background
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value as BackgroundId)}
              >
                {BACKGROUNDS.map((bg) => (
                  <option key={bg.id} value={bg.id}>
                    {bg.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.segmented} role="group" aria-label="Position">
              {(['left', 'center', 'right'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={position === p}
                  onClick={() => setPosition(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.viewport}>
        {view === 'sprite' ? (
          <div className={styles.preview}>
            {sprite}
            {showGuide && (
              <img src={`${BASE}templates/alignment-guide.svg`} alt="" className={styles.guide} />
            )}
          </div>
        ) : (
          <div className={styles.scene}>
            <img
              src={`${BASE}backgrounds/${background}.svg`}
              alt=""
              className={styles.backdrop}
              data-testid="scene-background"
            />
            <div
              className={styles.sceneSprite}
              style={{ left: SCENE_LEFT[position] }}
              data-testid="scene-sprite"
            >
              {sprite}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
