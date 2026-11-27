import { useState } from 'react';
import { shareUrl } from '../export/shareLink';
import { t } from '../i18n';
import { useCharacterStore } from '../store/useCharacterStore';
import { ConfirmDialog } from './ConfirmDialog';

interface Shared {
  url: string;
  copied: boolean;
}

export function ShareButton() {
  const [shared, setShared] = useState<Shared | null>(null);

  const share = async () => {
    const url = shareUrl(useCharacterStore.getState().character, window.location);
    let copied = true;
    try {
      // missing on plain http, e.g. testing over the local network
      await navigator.clipboard.writeText(url);
    } catch {
      copied = false;
    }
    setShared({ url, copied });
  };

  return (
    <>
      <button type="button" onClick={() => void share()}>
        {t('share.button')}
      </button>
      {shared && (
        <ConfirmDialog title={t('share.title')} onCancel={() => setShared(null)}>
          <p>{t(shared.copied ? 'share.copied' : 'share.manual')}</p>
          <input
            aria-label={t('share.title')}
            readOnly
            value={shared.url}
            style={{ width: '100%' }}
            onFocus={(e) => e.target.select()}
          />
          <small>{t('share.hint')}</small>
        </ConfirmDialog>
      )}
    </>
  );
}
