import { useState } from 'react';
import { CharacterSvg } from '../canvas/CharacterSvg';
import { getPresetExpression } from '../expressions/presets';
import { t } from '../i18n';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Character, Expression } from '../types';
import styles from './Stage.module.css';

const BASE = import.meta.env.BASE_URL;

const BACKGROUNDS = ['room', 'kitchen', 'courtyard', 'classroom', 'rooftop'] as const;

type View = 'sprite' | 'scene';
type BackgroundId = (typeof BACKGROUNDS)[number];
type ScenePosition = 'left' | 'center' | 'right';

// Ren'Py's left/center/right on a 1920 wide screen, sprite is 800 wide
const SCENE_LEFT: Record<ScenePosition, string> = {
  left: '0%',
  center: `${((1920 - 800) / 2 / 1920) * 100}%`,
  right: `${((1920 - 800) / 1920) * 100}%`,
};

// where others stand, by where the selected character stands
const OTHER_SPOTS: Record<ScenePosition, ScenePosition[]> = {
  left: ['right', 'center'],
  center: ['left', 'right'],
  right: ['left', 'center'],
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
  // other cast members in the scene, up to two
  const [withIds, setWithIds] = useState<string[]>([]);
  const cast = useCharacterStore((s) => s.cast);
  const activeId = useCharacterStore((s) => s.activeId);
  const others = cast.filter((m) => m.id !== activeId);
  // ids of people since selected or removed don't count
  const companions = withIds.flatMap((id) => others.filter((m) => m.id === id));
  const toggleCompanion = (id: string) =>
    setWithIds(() => {
      const current = companions.map((m) => m.id);
      return current.includes(id) ? current.filter((i) => i !== id) : [...current, id].slice(-2);
    });

  const sprite = (
    <CharacterSvg
      character={character}
      expression={expression}
      className={styles.sprite}
      title={t('stage.preview')}
    />
  );

  return (
    <div className={styles.stage}>
      <div className={styles.toolbar}>
        <div className={styles.segmented} role="group" aria-label={t('stage.view')}>
          {(['sprite', 'scene'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
              {t(`stage.${v}`)}
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
            {t('stage.guide')}
          </label>
        ) : (
          <>
            <label className={styles.option}>
              {t('stage.background')}
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value as BackgroundId)}
              >
                {BACKGROUNDS.map((id) => (
                  <option key={id} value={id}>
                    {t(`bg.${id}`)}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.segmented} role="group" aria-label={t('stage.position')}>
              {(['left', 'center', 'right'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={position === p}
                  onClick={() => setPosition(p)}
                >
                  {t(`stage.${p}`)}
                </button>
              ))}
            </div>
            {others.length > 0 && (
              <div className={styles.segmented} role="group" aria-label={t('stage.alsoOnStage')}>
                {others.map((m) => {
                  const on = companions.some((c) => c.id === m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && companions.length >= 2}
                      onClick={() => toggleCompanion(m.id)}
                    >
                      + {m.character.name || t('common.unnamed')}
                    </button>
                  );
                })}
              </div>
            )}
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
            {/* others first, so the selected character stands in front */}
            {companions.map((m, i) => (
              <div
                key={m.id}
                className={styles.sceneSprite}
                style={{ left: SCENE_LEFT[OTHER_SPOTS[position][i] ?? 'left'] }}
                data-testid="scene-companion"
              >
                <CharacterSvg
                  character={m.character}
                  expression={getPresetExpression('neutral', m.character)}
                  className={styles.sprite}
                  title={m.character.name}
                />
              </div>
            ))}
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
