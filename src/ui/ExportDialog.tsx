import { useEffect, useId, useRef, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH, renderSvgString } from '../canvas/svgString';
import { downloadBlob } from '../export/download';
import {
  buildSpriteZip,
  type ExportOptions,
  exportFileNames,
  type Scale,
} from '../export/exportZip';
import { type ImageFormat, spriteFileName, zipFileName } from '../export/fileNames';
import { svgToImage, svgToImageBytes } from '../export/svgToPng';
import { listExpressions } from '../expressions/presets';
import { useCharacterStore } from '../store/useCharacterStore';
import type { Expression } from '../types';
import styles from './ExportDialog.module.css';

const SCALES: readonly Scale[] = [0.5, 1, 2];
const FORMATS: readonly ImageFormat[] = ['png', 'webp'];

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; done: number; total: number }
  | { kind: 'done'; message: string }
  | { kind: 'error'; message: string };

interface ExportDialogProps {
  /** what's on screen, for the single download */
  active: Expression;
  onClose: () => void;
}

export function ExportDialog({ active, onClose }: ExportDialogProps) {
  const character = useCharacterStore((s) => s.character);
  const setExpressionExported = useCharacterStore((s) => s.setExpressionExported);
  const [options, setOptions] = useState<ExportOptions>({
    scale: 1,
    format: 'png',
    includeJson: true,
    mode: 'sprites',
    sideImages: false,
    blinkTalk: true,
  });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const all = listExpressions(character);
  const selected = all.filter((e) => character.expressions.includes(e.id));
  const busy = status.kind === 'busy';
  const singleName = spriteFileName(character.name, active.id, options.format);
  const layered = options.mode === 'layered';

  // a layered export can refuse some expression names; say why instead of crashing
  let fileNames: string[] = [];
  let planError: string | null = null;
  try {
    fileNames = exportFileNames(character, selected, options);
  } catch (err) {
    planError = err instanceof Error ? err.message : String(err);
  }
  const errorMessage = planError ?? (status.kind === 'error' ? status.message : null);

  // latest onClose, without re-running the focus effect
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // grab focus, close on Escape, hand focus back after
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, []);

  const run = async (task: () => Promise<string>) => {
    setStatus({ kind: 'busy', done: 0, total: 0 });
    try {
      setStatus({ kind: 'done', message: await task() });
    } catch (err) {
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  };

  const exportZip = () =>
    run(async () => {
      const bytes = await buildSpriteZip(character, selected, options, svgToImageBytes, (done, total) =>
        setStatus({ kind: 'busy', done, total }),
      );
      const name = zipFileName(character.name);
      downloadBlob(new Blob([bytes], { type: 'application/zip' }), name);
      return `Saved ${name}`;
    });

  const exportOne = () =>
    run(async () => {
      const svg = renderSvgString(character, active, options.scale);
      downloadBlob(await svgToImage(svg, options.format), singleName);
      return `Saved ${singleName}`;
    });

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={dialog}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.title}>
          Export
        </h2>

        <div className={styles.body}>
          <fieldset className={styles.group}>
            <legend>Expressions</legend>
            {all.map((e) => (
              <label key={e.id} className={styles.check}>
                <input
                  type="checkbox"
                  checked={character.expressions.includes(e.id)}
                  onChange={(ev) => setExpressionExported(e.id, ev.target.checked)}
                />
                {e.id}
              </label>
            ))}
          </fieldset>

          <div className={styles.column}>
            <fieldset className={styles.group}>
              <legend>Size</legend>
              {SCALES.map((scale) => (
                <label key={scale} className={styles.check}>
                  <input
                    type="radio"
                    name="scale"
                    checked={options.scale === scale}
                    onChange={() => setOptions({ ...options, scale })}
                  />
                  {scale}×{' '}
                  <small>
                    {CANVAS_WIDTH * scale}×{CANVAS_HEIGHT * scale}
                  </small>
                </label>
              ))}
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Format</legend>
              {FORMATS.map((format) => (
                <label key={format} className={styles.check}>
                  <input
                    type="radio"
                    name="format"
                    checked={options.format === format}
                    onChange={() => setOptions({ ...options, format })}
                  />
                  {format.toUpperCase()}
                </label>
              ))}
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={options.includeJson}
                  onChange={(e) => setOptions({ ...options, includeJson: e.target.checked })}
                />
                Include character.json
              </label>
            </fieldset>

            <fieldset className={styles.group}>
              <legend>Ren&rsquo;Py</legend>
              <label className={styles.check}>
                <input
                  type="radio"
                  name="mode"
                  checked={!layered}
                  onChange={() => setOptions({ ...options, mode: 'sprites' })}
                />
                Sprites <small>one PNG per expression</small>
              </label>
              <label className={styles.check}>
                <input
                  type="radio"
                  name="mode"
                  checked={layered}
                  onChange={() => setOptions({ ...options, mode: 'layered' })}
                />
                Layered <small>parts + layeredimage</small>
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={options.sideImages}
                  onChange={(e) => setOptions({ ...options, sideImages: e.target.checked })}
                />
                Side images
              </label>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={layered && options.blinkTalk}
                  disabled={!layered}
                  onChange={(e) => setOptions({ ...options, blinkTalk: e.target.checked })}
                />
                Blink &amp; talk {!layered && <small>layered only</small>}
              </label>
            </fieldset>
          </div>

          <fieldset className={styles.group}>
            <legend>{zipFileName(character.name)}</legend>
            <ul className={styles.files} aria-label="Files in the zip">
              {fileNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </fieldset>
        </div>

        <p className={styles.status} role="status">
          {status.kind === 'busy' &&
            `Exporting…${status.total > 0 ? ` ${status.done}/${status.total}` : ''}`}
          {status.kind === 'done' && status.message}
        </p>
        {errorMessage && (
          <p className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Close
          </button>
          <button type="button" onClick={exportOne} disabled={busy}>
            Only {singleName}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={exportZip}
            disabled={busy || selected.length === 0 || planError !== null}
          >
            Download zip
          </button>
        </div>
      </div>
    </div>
  );
}
