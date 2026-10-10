import { scanText, severityAtLeast, type ScanResult } from '@safeprompt/core';
import { policyFor, type PastePolicy } from '../settings/policy';
import { DEFAULT_SETTINGS } from '../settings/schema';
import { resolveAdapter } from './adapters';
import { targetFromEvent } from './adapters/generic';
import type { PasteTarget } from './adapters/types';
import { failOpen } from './guard';
import { captureSelection, insertText, type SelectionSnapshot } from './insert';

export interface PasteDecision {
  /** Exactly what was on the clipboard, so "paste original" needs no round-trip. */
  readonly original: string;
  readonly result: ScanResult;
  /** Adapter id, e.g. `claude`. Recorded in history instead of the URL. */
  readonly site: string;
  readonly target: PasteTarget;
  readonly selection: SelectionSnapshot;
}

export interface InterceptorOptions {
  /** Called when a paste is held. The paste is already cancelled by this point. */
  readonly onHold: (decision: PasteDecision) => void;
  /**
   * Called when a paste went through unchecked because the page has no message
   * box the site's adapter recognises. The paste is not touched.
   */
  readonly onUnwatched?: (site: string) => void;
  /** Read at the moment of each paste, so settings changes apply immediately. */
  readonly policy?: (site: string) => PastePolicy;
  readonly location?: URL;
}

/**
 * A message box is a textarea or a rich editor, never a single-line input.
 * Leaving inputs out keeps a paste into a login or search field from looking
 * like a missed message box.
 */
function couldBeComposer(event: ClipboardEvent): boolean {
  const target = targetFromEvent(event);
  return target !== null && !(target.element instanceof HTMLInputElement);
}

const defaultPolicy = (site: string): PastePolicy => policyFor(DEFAULT_SETTINGS, site);

/**
 * Decide whether to hold a paste.
 *
 * Returns the decision if the paste was cancelled, or null if it was allowed
 * through. Everything that could throw is wrapped, so if something fails the
 * paste is let through and the user doesn't lose it.
 */
export function handlePaste(
  event: ClipboardEvent,
  options: InterceptorOptions,
): PasteDecision | null {
  const decision = failOpen<PasteDecision | null>(null, () => {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (text.trim().length === 0) return null;

    const url = options.location ?? new URL(window.location.href);
    const adapter = resolveAdapter(url);
    const policy = (options.policy ?? defaultPolicy)(adapter.id);
    if (!policy.active) return null;

    const target = adapter.resolveTarget(event);
    if (target === null) {
      // Not the message box, which is normally fine: a search field, say. But
      // if the page has no message box the adapter knows at all, the site has
      // probably changed and this may be the composer going unchecked.
      if (couldBeComposer(event) && !adapter.hasComposer(document)) {
        options.onUnwatched?.(adapter.id);
      }
      return null;
    }

    const result = scanText(text, policy.scan);
    if (result.findings.length === 0) return null;
    if (!severityAtLeast(result.risk.level, policy.threshold)) return null;

    return {
      original: text,
      result,
      site: adapter.id,
      target,
      selection: captureSelection(target),
    };
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
