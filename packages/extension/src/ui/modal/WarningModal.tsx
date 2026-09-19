import type { ScanResult, Severity } from '@safeprompt/core';
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { groupFindings, type FindingGroup } from './group';
import { MODAL_CSS } from './styles';

/**
 * Written to describe what was found without sounding alarming, as the spec
 * asks for a professional tone.
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
  /** Shown above the buttons, e.g. when the editor refused the text. */
  readonly notice?: string;
}

function summarise(groups: readonly FindingGroup[]): string {
  const [worst] = groups;
  if (worst === undefined) return 'Nothing sensitive was found.';

  const found =
    groups.length === 1
      ? `Found: ${worst.name}.`
      : `${groups.length} kinds of sensitive content found. Most serious: ${worst.name}.`;

  return `${found} You can send a redacted version instead.`;
}

function detail(group: FindingGroup): string | null {
  if (group.parts.length > 1) return group.parts.join(', ');
  if (group.count > 1) return `${group.count} found`;
  return null;
}

export function WarningModal({
  result,
  onPasteRedacted,
  onPasteOriginal,
  onCancel,
  notice,
}: WarningModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const groups = groupFindings(result.findings);

  useEffect(() => {
    // Without this, focus stays in the composer behind the modal and anything
    // typed goes into it. Enter then takes the safe option.
    primary.current?.focus();

    // Listen on window in the capture phase, so Escape works wherever focus is
    // and the page doesn't also receive it. Some of these sites use Escape too.
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
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

  useEffect(() => {
    // A failed insertion restores focus to the editor first, so take it back.
    if (notice !== undefined) primary.current?.focus();
  }, [notice]);

  // Tab cycles through the modal's own controls rather than walking out into
  // the page behind it.
  const onPanelKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || panel.current === null) return;

    const controls = [...panel.current.querySelectorAll<HTMLElement>('button')];
    if (controls.length === 0) return;

    // Inside a shadow root, `document.activeElement` is the host, not the button.
    const root = panel.current.getRootNode() as Document | ShadowRoot;
    const index = controls.indexOf(root.activeElement as HTMLElement);
    const last = controls.length - 1;
    const next = event.shiftKey ? (index <= 0 ? last : index - 1) : index >= last ? 0 : index + 1;

    event.preventDefault();
    controls[next]?.focus();
  };

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
        <div
          ref={panel}
          className="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="safeprompt-title"
          onKeyDown={onPanelKeyDown}
        >
          <header>
            <span className="level">
              <span className={`dot ${result.risk.level}`} />
              {result.risk.level} risk · {result.risk.score}/100 · {result.context}
            </span>
            <h1 id="safeprompt-title">{HEADLINE[result.risk.level]}</h1>
            <p className="summary">{summarise(groups)}</p>
          </header>

          <div className="body">
            <h2>What was found</h2>
            <ul>
              {groups.map((group) => (
                <li key={group.detectorId}>
                  <div className="finding-label">
                    <span className={`dot ${group.severity}`} />
                    {group.name}
                  </div>
                  {detail(group) !== null && <p className="finding-parts">{detail(group)}</p>}
                  <p className="finding-why">{group.evidence.join('. ')}</p>
                </li>
              ))}
            </ul>

            <h2>Redacted version</h2>
            <pre>{result.redacted}</pre>
          </div>

          {notice !== undefined && (
            <p className="notice" role="alert">
              {notice}
            </p>
          )}

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
