import { useRef, useState } from 'react';
import { t } from '../i18n';
import { customPartIdentity, MAX_CUSTOM_PARTS } from '../parts/customParts';
import { sanitizeSvgFile, SvgPartError } from '../parts/sanitizeSvg';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Slot } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './PartPicker.module.css';

interface UploadPartProps {
  slot: Slot;
  disabled: boolean;
  /** new part id, to select it */
  onAdded: (id: string) => void;
}

/** "+ Upload" card: your own SVG on the 800×1080 canvas, checked and cleaned first */
export function UploadPart({ slot, disabled, onAdded }: UploadPartProps) {
  const addCustomPart = useCharacterStore((s) => s.addCustomPart);
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(null);

  const upload = async (file: File) => {
    const taken = useCharacterStore.getState().character.customParts ?? [];
    if (taken.length >= MAX_CUSTOM_PARTS) {
      setNotice({
        title: t('upload.limitTitle'),
        text: t('upload.limitText', { max: MAX_CUSTOM_PARTS }),
      });
      return;
    }
    try {
      const { svg, removed } = sanitizeSvgFile(await file.text());
      const { id, label } = customPartIdentity(file.name, taken);
      addCustomPart({ id, slot, label, svg });
      onAdded(id);
      if (removed > 0) {
        setNotice({
          title: t('upload.changedTitle'),
          text: t('upload.changedText', { count: removed }),
        });
      }
    } catch (err) {
      const text = err instanceof SvgPartError ? err.message : t('upload.unreadable');
      setNotice({ title: t('upload.badTitle'), text });
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.item} ${styles.upload}`}
        disabled={disabled}
        title={t('upload.hint')}
        onClick={() => input.current?.click()}
      >
        <span className={styles.uploadPlus} aria-hidden="true">
          +
        </span>
        <span>{t('upload.button')}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/svg+xml,.svg"
        hidden
        data-testid="upload-part"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // so the same file can be picked twice
          if (file) void upload(file);
        }}
      />
      {notice && (
        <ConfirmDialog title={notice.title} onCancel={() => setNotice(null)}>
          <p>{notice.text}</p>
        </ConfirmDialog>
      )}
    </>
  );
}
