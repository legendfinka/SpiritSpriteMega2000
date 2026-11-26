import { CharacterSvg, HEAD_VIEWBOX } from '../canvas/CharacterSvg';
import { getPresetExpression, isPresetId, listExpressions } from '../expressions/presets';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression, ExpressionId } from '../types';
import { ExpressionPlate } from './ExpressionPlate';
import styles from './ExpressionStrip.module.css';

interface ExpressionStripProps {
  active: Expression;
  onSelect: (id: ExpressionId) => void;
}

/** Building facade: one window per expression, the selected one is lit. */
export function ExpressionStrip({ active, onSelect }: ExpressionStripProps) {
  const character = useCharacterStore((s) => s.character);
  const addExpression = useCharacterStore((s) => s.addExpression);

  const addNew = () => {
    const base = getPresetExpression('neutral', character);
    onSelect(addExpression({ ...base, id: 'custom' }));
  };

  return (
    <footer className={styles.strip}>
      <div className={styles.windows}>
        {listExpressions(character).map((expr) => (
          <button
            key={expr.id}
            type="button"
            className={styles.window}
            aria-pressed={expr.id === active.id}
            onClick={() => onSelect(expr.id)}
          >
            <CharacterSvg
              character={character}
              expression={expr}
              viewBox={HEAD_VIEWBOX}
              className={styles.windowSvg}
            />
            <span className={styles.sill}>{expr.id}</span>
          </button>
        ))}
        <button
          type="button"
          className={styles.window}
          aria-label="New expression"
          onClick={addNew}
        >
          <span className={styles.addPane} aria-hidden="true">
            +
          </span>
          <span className={styles.sill}>new</span>
        </button>
      </div>
      <ExpressionPlate
        key={active.id}
        expression={active}
        custom={!isPresetId(active.id)}
        onActiveChange={onSelect}
      />
    </footer>
  );
}
