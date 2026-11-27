import { type RefObject, useEffect, useRef } from 'react';

/** popups: focus `focus` on open, Escape calls onClose, focus goes back on close */
export function useModal(onClose: () => void, focus: RefObject<HTMLElement | null>): void {
  // latest onClose, without re-running the focus effect
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    focus.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [focus]);
}
