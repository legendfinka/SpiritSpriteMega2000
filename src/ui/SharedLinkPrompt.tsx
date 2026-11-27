import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { characterFromHash } from '../export/shareLink';
import { t } from '../i18n';
import { MAX_CAST } from '../store/cast';
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

/** asks first, then adds the shared character to the cast */
export function SharedLinkPrompt({ onOpened }: SharedLinkPromptProps) {
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const full = useCharacterStore((s) => s.cast.length >= MAX_CAST);
  const hash = useSyncExternalStore(subscribeShareLink, pendingShareHash);
  // null = broken link
  const incoming = useMemo(() => (hash === null ? null : characterFromHash(hash)), [hash]);

  useEffect(() => captureShareLink(), []);

  if (hash === null) return null;

  if (incoming === null) {
    return (
      <ConfirmDialog title={t('shared.brokenTitle')} onCancel={dismissShareLink}>
        <p>{t('shared.brokenText')}</p>
        <small>{t('shared.brokenHint')}</small>
      </ConfirmDialog>
    );
  }

  const name = incoming.name || t('common.unnamed');
  return (
    <ConfirmDialog
      title={t('shared.title')}
      confirmLabel={t('shared.add')}
      cancelLabel={t('shared.later')}
      onCancel={dismissShareLink}
      onConfirm={() => {
        // a full cast can't take more; replace the selected character instead
        if (full) loadCharacter(incoming);
        else addCharacter(incoming);
        onOpened();
        dismissShareLink();
      }}
    >
      <p>{t(full ? 'shared.replace' : 'shared.question', { name })}</p>
      <small>{t('shared.hint')}</small>
    </ConfirmDialog>
  );
}
