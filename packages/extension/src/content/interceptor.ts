import { scanText, type ScanResult } from '@safeprompt/core';
import { resolveAdapter } from './adapters';
import type { PasteTarget } from './adapters/types';
import { failOpen } from './guard';
import { captureSelection, insertText, type SelectionSnapshot } from './insert';

export interface PasteDecision {
  /** Exactly what was on the clipboard, so "paste original" needs no round-trip. */
  readonly original: string;
  readonly result: ScanResult;
  readonly target: PasteTarget;
  readonly selection: SelectionSnapshot;
}

export interface InterceptorOptions {
  /** Called when a paste is held. The paste is already cancelled by this point. */
  readonly onHold: (decision: PasteDecision) => void;
  readonly location?: URL;
}

/**
 * Decide whether to hold a paste.
 *
 * Returns the decision if the paste was cancelled, or null if it was allowed
 * through. Everything that could throw is wrapped so that the answer on failure
 * is always "let it through": a broken adapter must cost the user nothing.
 */
export function handlePaste(
  event: ClipboardEvent,
  options: InterceptorOptions,
): PasteDecision | null {
  const decision = failOpen<PasteDecision | null>(null, () => {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (text.trim().length === 0) return null;

    const url = options.location ?? new URL(window.location.href);
    const target = resolveAdapter(url).resolveTarget(event);
    if (target === null) return null;

    const result = scanText(text);
    if (result.findings.length === 0) return null;

    return { original: text, result, target, selection: captureSelection(target) };
  });

  if (decision === null) return null;

  // Only now, once everything that could fail has succeeded.
  event.preventDefault();
  options.onHold(decision);

  return decision;
}

/**
 * Put text into the editor the paste was aimed at.
 *
 * The user has already chosen at this point, so a failure here loses their
 * text. Returning false lets the caller say so rather than failing silently.
 */
export function completePaste(decision: PasteDecision, text: string): boolean {
  return failOpen(false, () => {
    decision.selection.restore();
    return insertText(decision.target, text);
  });
}

export function installInterceptor(options: InterceptorOptions): () => void {
  const listener = (event: Event): void => {
    if (!(event instanceof ClipboardEvent)) return;
    handlePaste(event, options);
  };

  // Capture phase: editors call stopPropagation on their own paste handling, so
  // by the bubble phase the event is long gone.
  document.addEventListener('paste', listener, true);

  return () => {
    document.removeEventListener('paste', listener, true);
  };
}
