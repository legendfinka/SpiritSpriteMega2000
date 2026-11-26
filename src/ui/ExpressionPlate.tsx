import { useId, useState } from 'react';
import { MAX_NAME_LENGTH } from '../expressions/names';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression, ExpressionId } from '../types';
import styles from './ExpressionStrip.module.css';

interface ExpressionPlateProps {
  expression: Expression;
  /** presets can only be duplicated */
  custom: boolean;
  onActiveChange: (id: ExpressionId) => void;
}

export function ExpressionPlate({ expression, custom, onActiveChange }: ExpressionPlateProps) {
  const addExpression = useCharacterStore((s) => s.addExpression);
  const renameExpression = useCharacterStore((s) => s.renameExpression);
  const removeExpression = useCharacterStore((s) => s.removeExpression);
  const [draft, setDraft] = useState(expression.id);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const commit = () => {
    const result = renameExpression(expression.id, draft);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setDraft(result.id);
    if (result.id !== expression.id) onActiveChange(result.id);
  };

  const remove = () => {
    if (!window.confirm(`Delete the “${expression.id}” expression?`)) return;
    removeExpression(expression.id);
    onActiveChange('neutral');
  };

  return (
    <div className={styles.plate}>
      <span className={styles.plateLabel}>Expression</span>
      {custom ? (
        <input
          className={styles.plateInput}
          aria-label="Expression name"
          value={draft}
          maxLength={MAX_NAME_LENGTH}
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              setDraft(expression.id);
              setError(null);
            }
          }}
        />
      ) : (
        <strong className={styles.plateName}>
          {expression.id} <small>preset</small>
        </strong>
      )}
      {error && (
        <span id={errorId} role="alert" className={styles.plateError}>
          {error}
        </span>
      )}
      <div className={styles.plateButtons}>
        <button type="button" onClick={() => onActiveChange(addExpression(expression))}>
          Duplicate
        </button>
        {custom && (
          <button type="button" onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
