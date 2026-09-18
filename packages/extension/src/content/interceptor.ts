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

  // Only now, once everything that could fail has succeeded. Cancelling is not
  // enough on its own: ProseMirror reads the clipboard in its own paste handler
  // and ignores defaultPrevented, so the editor has to never see the event.
  event.preventDefault();
  event.stopImmediatePropagation();
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

/** Leave the editor as it was, with focus and caret back where the user left them. */
export function cancelPaste(decision: PasteDecision): void {
  failOpen(undefined, () => {
    decision.selection.restore();
  });
}

export function installInterceptor(options: InterceptorOptions): () => void {
  const listener = (event: Event): void => {
    handlePaste(event as ClipboardEvent, options);
  };

  // Window, capture phase: the first point in the event's path, ahead of every
  // document and element listener the page or its editor registers, whatever
  // order they were added in.
  window.addEventListener('paste', listener, true);

  return () => {
    window.removeEventListener('paste', listener, true);
  };
}
