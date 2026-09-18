import type { ScanResult, Severity } from '@safeprompt/core';
import { useEffect, useRef, type MouseEvent } from 'react';
import { MODAL_CSS } from './styles';

/**
 * Factual rather than urgent. The user is a competent adult who pasted
 * something; the job is to tell them what is in it, not to alarm them.
 */
const HEADLINE: Record<Severity, string> = {
  low: 'Some personal details in this paste',
  medium: 'Worth checking before you send',
  high: 'This paste contains sensitive data',
  critical: 'This paste contains credentials',
};

export interface WarningModalProps {
  readonly result: ScanResult;
  readonly onPasteRedacted: () => void;
  readonly onPasteOriginal: () => void;
  readonly onCancel: () => void;
}

function summarise(result: ScanResult): string {
  const count = result.findings.length;
  const noun = count === 1 ? 'item' : 'items';
  const worst = result.risk.breakdown[0];

  if (worst === undefined) return 'Nothing sensitive was found.';

  return `${count} ${noun} found, the most serious being ${worst.label.toLowerCase()}. You can send a redacted version instead.`;
}

export function WarningModal({
  result,
  onPasteRedacted,
  onPasteOriginal,
  onCancel,
}: WarningModalProps) {
  const primary = useRef<HTMLButtonElement>(null);
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    // Without this, focus stays in the composer behind the modal and anything
    // typed goes into it. Enter then takes the safe option.
    primary.current?.focus();

    // On window, in the capture phase, so Escape works wherever focus is and the
    // page never sees the keystroke — several of these sites bind Escape too.
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCancel();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [onCancel]);

  // Only a click that both starts and ends on the backdrop cancels. Selecting
  // text in the preview and releasing outside the panel produces a click on the
  // backdrop too, and that should not throw the paste away.
  const onBackdropMouseDown = (event: MouseEvent): void => {
    pressStartedOnBackdrop.current = event.target === event.currentTarget;
  };

  const onBackdropClick = (event: MouseEvent): void => {
    const outside = pressStartedOnBackdrop.current && event.target === event.currentTarget;
    pressStartedOnBackdrop.current = false;
    if (outside) onCancel();
  };

  return (
    <>
      <style>{MODAL_CSS}</style>

      <div className="backdrop" onMouseDown={onBackdropMouseDown} onClick={onBackdropClick}>
        <div className="panel" role="dialog" aria-modal="true" aria-labelledby="safeprompt-title">
          <header>
            <span className="level">
              <span className={`dot ${result.risk.level}`} />
              {result.risk.level} risk · {result.risk.score}/100 · {result.context}
            </span>
            <h1 id="safeprompt-title">{HEADLINE[result.risk.level]}</h1>
            <p className="summary">{summarise(result)}</p>
          </header>

          <div className="body">
            <h2>What was found</h2>
            <ul>
              {result.findings.map((finding) => (
                <li key={`${finding.detectorId}-${finding.span.start}`}>
                  <div className="finding-label">{finding.label}</div>
                  <p className="finding-why">{finding.evidence.join('. ')}</p>
                </li>
              ))}
            </ul>

            <h2>Redacted version</h2>
            <pre>{result.redacted}</pre>
          </div>

          <footer>
            <button type="button" className="subtle" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" onClick={onPasteOriginal}>
              Paste original
            </button>
            <button type="button" className="primary" ref={primary} onClick={onPasteRedacted}>
              Paste redacted
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}
