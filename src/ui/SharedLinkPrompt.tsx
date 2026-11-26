import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { characterFromHash } from '../export/shareLink';
import { useCharacterStore } from '../store/useCharacterStore';
import { ConfirmDialog } from './ConfirmDialog';
import {
  captureShareLink,
  dismissShareLink,
  pendingShareHash,
  subscribeShareLink,
} from './sharedLink';

interface SharedLinkPromptProps {
  onOpened: () => void;
}

/** asks first: opening a link replaces the saved character */
export function SharedLinkPrompt({ onOpened }: SharedLinkPromptProps) {
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const hash = useSyncExternalStore(subscribeShareLink, pendingShareHash);
  // null = broken link
  const incoming = useMemo(() => (hash === null ? null : characterFromHash(hash)), [hash]);

  useEffect(() => captureShareLink(), []);

  if (hash === null) return null;

  if (incoming === null) {
    return (
      <ConfirmDialog title="Broken link" onCancel={dismissShareLink}>
        <p>That share link doesn&rsquo;t hold a character.</p>
        <small>It may have been cut off while copying.</small>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      title="Shared character"
      confirmLabel="Open it"
      cancelLabel="Keep mine"
      onCancel={dismissShareLink}
      onConfirm={() => {
        loadCharacter(incoming);
        onOpened();
        dismissShareLink();
      }}
    >
      <p>Open &ldquo;{incoming.name || 'unnamed'}&rdquo;? It replaces your current character.</p>
      <small>Undo brings yours back, until you reload the page.</small>
    </ConfirmDialog>
  );
}
