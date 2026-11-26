import { useId, useState } from 'react';
import { MAX_NAME_LENGTH } from '../expressions/names';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression, ExpressionId } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
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

  const [deleting, setDeleting] = useState(false);

  const remove = () => {
    removeExpression(expression.id);
    setDeleting(false);
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
          <button type="button" onClick={() => setDeleting(true)}>
            Delete
          </button>
        )}
      </div>
      {deleting && (
        <ConfirmDialog
          title="Delete expression?"
          confirmLabel="Delete"
          cancelLabel="Keep"
          onConfirm={remove}
          onCancel={() => setDeleting(false)}
        >
          <p>“{expression.id}” will be gone.</p>
          <small>Undo brings it back.</small>
        </ConfirmDialog>
      )}
    </div>
  );
}
