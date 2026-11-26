import { useState } from 'react';
import { shareUrl } from '../export/shareLink';
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
        Share
      </button>
      {shared && (
        <ConfirmDialog title="Share link" onCancel={() => setShared(null)}>
          <p>{shared.copied ? 'Copied to clipboard.' : 'Copy it from the box.'}</p>
          <input
            aria-label="Share link"
            readOnly
            value={shared.url}
            style={{ width: '100%' }}
            onFocus={(e) => e.target.select()}
          />
          <small>Anyone with the link gets a copy of this character.</small>
        </ConfirmDialog>
      )}
    </>
  );
}
