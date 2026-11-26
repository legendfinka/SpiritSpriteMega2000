import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  /** leave out onConfirm for a plain notice with one button */
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  children,
  onConfirm,
  confirmLabel = 'OK',
  cancelLabel = onConfirm ? 'Cancel' : 'OK',
  onCancel,
}: ConfirmDialogProps) {
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  // latest onCancel, without re-running the focus effect
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });

  // focus the safe button, close on Escape, hand focus back after
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, []);

  // portal: a rotated parent (the name plate) would trap position: fixed
  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div id={textId} className={styles.text}>
          {children}
        </div>
        <div className={styles.actions}>
          <button ref={cancel} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          {onConfirm && (
            <button type="button" className={styles.danger} onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
