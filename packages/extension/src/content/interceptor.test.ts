import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PastePolicy } from '../settings/policy';
import {
  cancelPaste,
  completePaste,
  handlePaste,
  installInterceptor,
  type PasteDecision,
} from './interceptor';

const SECRET = 'AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B';
const CLEAN = 'why does my build take four minutes';

function pasteEvent(text: string, target: EventTarget): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
  });
  Object.defineProperty(event, 'target', { value: target });

  return event;
}

function composer(): HTMLTextAreaElement {
  const el = document.createElement('textarea');
  document.body.appendChild(el);
  return el;
}

const url = new URL('https://chatgpt.com/');
const genericUrl = new URL('https://example.com/');

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('handlePaste', () => {
  it('holds a paste containing a secret', () => {
    const onHold = vi.fn();
    const event = pasteEvent(SECRET, composer());

    const decision = handlePaste(event, { onHold, location: genericUrl });

    expect(decision).not.toBeNull();
    expect(event.defaultPrevented).toBe(true);
    expect(onHold).toHaveBeenCalledOnce();
  });

  it('lets clean text through untouched', () => {
    const onHold = vi.fn();
    const event = pasteEvent(CLEAN, composer());

    expect(handlePaste(event, { onHold, location: genericUrl })).toBeNull();
    expect(event.defaultPrevented).toBe(false);
    expect(onHold).not.toHaveBeenCalled();
  });

  it('keeps the original text alongside the redacted version', () => {
    const decision = handlePaste(pasteEvent(SECRET, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
    });

    expect(decision?.original).toBe(SECRET);
    expect(decision?.result.redacted).not.toContain('AKIA2E0RZXQ7MLPKWV3B');
  });

  it('ignores an empty or whitespace-only clipboard', () => {
    const event = pasteEvent('   \n ', composer());
    expect(handlePaste(event, { onHold: vi.fn(), location: genericUrl })).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores a paste into something that is not editable', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const event = pasteEvent(SECRET, div);
    expect(handlePaste(event, { onHold: vi.fn(), location: genericUrl })).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores a read-only field', () => {
    const el = composer();
    el.readOnly = true;

    expect(
      handlePaste(pasteEvent(SECRET, el), { onHold: vi.fn(), location: genericUrl }),
    ).toBeNull();
  });

  it('ignores a paste outside the composer on a site with an adapter', () => {
    // ChatGPT's adapter only claims its own message box, so a search field is
    // left alone even though the text is sensitive.
    const event = pasteEvent(SECRET, composer());
    expect(handlePaste(event, { onHold: vi.fn(), location: url })).toBeNull();
  });

  it('holds a paste into the ChatGPT composer', () => {
    const el = composer();
    el.id = 'prompt-textarea';

    const event = pasteEvent(SECRET, el);
    expect(handlePaste(event, { onHold: vi.fn(), location: url })).not.toBeNull();
    expect(event.defaultPrevented).toBe(true);
  });

  it('lets the paste through when the clipboard throws', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', {
      get() {
        throw new Error('clipboard unavailable');
      },
    });

    expect(handlePaste(event, { onHold: vi.fn(), location: genericUrl })).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets the paste through when an adapter throws', () => {
    const el = composer();
    // A selector an editor rewrite could break.
    vi.spyOn(el, 'closest').mockImplementation(() => {
      throw new Error('adapter broke');
    });

    const event = pasteEvent(SECRET, el);
    expect(handlePaste(event, { onHold: vi.fn(), location: url })).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('never cancels a paste it does not hold', () => {
    for (const text of [CLEAN, '', '   ']) {
      const event = pasteEvent(text, composer());
      handlePaste(event, { onHold: vi.fn(), location: genericUrl });
      expect(event.defaultPrevented).toBe(false);
    }
  });
});

describe('handlePaste with settings', () => {
  const policy =
    (overrides: Partial<PastePolicy> = {}) =>
    (): PastePolicy => ({
      active: true,
      threshold: 'low',
      scan: {},
      ...overrides,
    });

  it('lets everything through when protection is off', () => {
    const event = pasteEvent(SECRET, composer());
    const decision = handlePaste(event, {
      onHold: vi.fn(),
      location: genericUrl,
      policy: policy({ active: false }),
    });

    expect(decision).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets a paste below the threshold through', () => {
    // An AWS key is high; with the bar at critical it is not held.
    const event = pasteEvent(SECRET, composer());
    const decision = handlePaste(event, {
      onHold: vi.fn(),
      location: genericUrl,
      policy: policy({ threshold: 'critical' }),
    });

    expect(decision).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('holds a lone email only when the threshold allows it', () => {
    const email = 'reach me at dana@acme.io';

    const strict = handlePaste(pasteEvent(email, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
      policy: policy({ threshold: 'low' }),
    });
    const relaxed = handlePaste(pasteEvent(email, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
      policy: policy({ threshold: 'medium' }),
    });

    expect(strict).not.toBeNull();
    expect(relaxed).toBeNull();
  });

  it('passes scan options through, so disabled categories stay quiet', () => {
    const decision = handlePaste(pasteEvent(SECRET, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
      policy: policy({ scan: { categories: ['pii'] } }),
    });

    expect(decision).toBeNull();
  });

  it('asks for the policy of the site being pasted into', () => {
    const el = composer();
    el.id = 'prompt-textarea';
    const lookup = vi.fn(policy());

    const decision = handlePaste(pasteEvent(SECRET, el), {
      onHold: vi.fn(),
      location: url,
      policy: lookup,
    });

    expect(lookup).toHaveBeenCalledWith('chatgpt');
    expect(decision?.site).toBe('chatgpt');
  });
});

describe('installInterceptor', () => {
  /** Dispatched for real, so it travels window → document → element. */
  function realPaste(text: string): Event {
    const event = new Event('paste', { bubbles: true, cancelable: true, composed: true });
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
    return event;
  }

  it('stops a held paste reaching an editor that ignores defaultPrevented', () => {
    // How ProseMirror behaves: it reads the clipboard in its own handler and
    // inserts regardless of whether anyone cancelled the event.
    const uninstall = installInterceptor({ onHold: vi.fn(), location: genericUrl });
    const el = composer();
    const editor = vi.fn();
    el.addEventListener('paste', editor);

    el.dispatchEvent(realPaste(SECRET));

    expect(editor).not.toHaveBeenCalled();
    uninstall();
  });

  it('runs ahead of page listeners registered before it', () => {
    const page = vi.fn();
    document.addEventListener('paste', page, true);

    const uninstall = installInterceptor({ onHold: vi.fn(), location: genericUrl });
    composer().dispatchEvent(realPaste(SECRET));

    expect(page).not.toHaveBeenCalled();
    uninstall();
    document.removeEventListener('paste', page, true);
  });

  it('lets a clean paste through to the editor', () => {
    const uninstall = installInterceptor({ onHold: vi.fn(), location: genericUrl });
    const el = composer();
    const editor = vi.fn();
    el.addEventListener('paste', editor);

    el.dispatchEvent(realPaste(CLEAN));

    expect(editor).toHaveBeenCalledOnce();
    uninstall();
  });

  it('stops listening once uninstalled', () => {
    const onHold = vi.fn();
    installInterceptor({ onHold, location: genericUrl })();

    composer().dispatchEvent(realPaste(SECRET));
    expect(onHold).not.toHaveBeenCalled();
  });
});

describe('cancelPaste', () => {
  it('returns focus and caret to the editor without inserting anything', () => {
    const el = composer();
    el.value = 'draft';
    el.setSelectionRange(2, 2);

    const decision = handlePaste(pasteEvent(SECRET, el), {
      onHold: vi.fn(),
      location: genericUrl,
    });
    if (decision === null) throw new Error('expected the paste to be held');

    document.body.focus();
    cancelPaste(decision);

    expect(el.value).toBe('draft');
    expect(document.activeElement).toBe(el);
    expect(el.selectionStart).toBe(2);
  });

  it('does not throw if the editor has gone', () => {
    const decision = handlePaste(pasteEvent(SECRET, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
    });
    if (decision === null) throw new Error('expected the paste to be held');

    vi.spyOn(decision.selection, 'restore').mockImplementation(() => {
      throw new Error('element detached');
    });

    expect(() => {
      cancelPaste(decision);
    }).not.toThrow();
  });
});

describe('completePaste', () => {
  function held(): PasteDecision {
    const decision = handlePaste(pasteEvent(SECRET, composer()), {
      onHold: vi.fn(),
      location: genericUrl,
    });

    if (decision === null) throw new Error('expected the paste to be held');
    return decision;
  }

  it('inserts the redacted text into the editor', () => {
    const decision = held();
    expect(completePaste(decision, decision.result.redacted)).toBe(true);

    const el = decision.target.element as HTMLTextAreaElement;
    expect(el.value).toBe(decision.result.redacted);
    expect(el.value).not.toContain('AKIA2E0RZXQ7MLPKWV3B');
  });

  it('inserts the original when that is what was chosen', () => {
    const decision = held();
    completePaste(decision, decision.original);

    expect((decision.target.element as HTMLTextAreaElement).value).toBe(SECRET);
  });

  it('notifies the editor so a controlled component updates', () => {
    const decision = held();
    const onInput = vi.fn();
    decision.target.element.addEventListener('input', onInput);

    completePaste(decision, 'text');
    expect(onInput).toHaveBeenCalledOnce();
  });

  it('inserts at the caret the paste was aimed at, after the modal stole focus', () => {
    const el = composer();
    el.value = 'before  after';
    el.setSelectionRange(7, 7);

    const decision = handlePaste(pasteEvent(SECRET, el), {
      onHold: vi.fn(),
      location: genericUrl,
    });
    if (decision === null) throw new Error('expected the paste to be held');

    // Opening the modal moves focus and collapses the selection.
    el.setSelectionRange(0, 0);

    completePaste(decision, 'X');
    expect(el.value).toBe('before X after');
  });

  it('replaces the selected text when the paste was over a selection', () => {
    const el = composer();
    el.value = 'keep REPLACE keep';
    el.setSelectionRange(5, 12);

    const decision = handlePaste(pasteEvent(SECRET, el), {
      onHold: vi.fn(),
      location: genericUrl,
    });
    if (decision === null) throw new Error('expected the paste to be held');

    completePaste(decision, 'X');
    expect(el.value).toBe('keep X keep');
  });

  it('reports failure rather than throwing when insertion breaks', () => {
    const decision = held();
    vi.spyOn(decision.selection, 'restore').mockImplementation(() => {
      throw new Error('element detached');
    });

    expect(completePaste(decision, 'text')).toBe(false);
  });
});
