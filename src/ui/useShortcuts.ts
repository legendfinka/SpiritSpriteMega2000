import { useEffect, useRef } from 'react';

/** "⌘" on Mac, "Ctrl" elsewhere, for tooltips */
export const MOD =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

export interface ShortcutHandlers {
  undo: () => void;
  redo: () => void;
  save: () => void;
  openExport: () => void;
  /** -1 / +1 */
  stepExpression: (delta: number) => void;
  /** 0-based, from the 1-9 keys */
  pickExpression: (index: number) => void;
}

// let text fields and radio groups keep their own keys
function isEditing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** global shortcuts; quiet while any modal dialog is open */
export function useShortcuts(handlers: ShortcutHandlers): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[aria-modal="true"]')) return;
      const h = ref.current;
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;
      const editing = isEditing(e.target);

      if (mod && !e.altKey) {
        if (key === 'z' && !editing) {
          e.preventDefault();
          if (e.shiftKey) h.redo();
          else h.undo();
        } else if (key === 'y' && !editing) {
          e.preventDefault();
          h.redo();
        } else if (key === 's') {
          e.preventDefault();
          h.save();
        } else if (key === 'e') {
          e.preventDefault();
          h.openExport();
        }
        return;
      }

      if (editing || e.altKey) return;
      if (key === 'arrowleft') h.stepExpression(-1);
      else if (key === 'arrowright') h.stepExpression(1);
      else if (/^[1-9]$/.test(key)) h.pickExpression(Number(key) - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
