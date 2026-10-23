import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureSelection, insertText } from './insert';

function editable(): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.textContent = '';
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** 650 lines, the size of paste that froze ChatGPT. */
const LONG = Array.from({ length: 650 }, (_, i) => `\tline ${i}`).join('\n');

describe('insertText into a rich-text editor', () => {
  it('hands the text over as a single paste, the way ProseMirror expects', () => {
    // execCommand makes one edit per line break, which froze ChatGPT on a long
    // paste. ProseMirror handles a paste event in one go and cancels it to
    // say so.
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    const element = editable();
    const received: string[] = [];
    element.addEventListener('paste', (event) => {
      received.push(event.clipboardData?.getData('text/plain') ?? '');
      event.preventDefault();
    });

    expect(insertText({ kind: 'contenteditable', element }, LONG)).toBe(true);
    expect(received).toEqual([LONG]);
    expect(exec).not.toHaveBeenCalled();
  });

  it('fills the hidden box an older Quill editor reads a paste from', () => {
    // Gemini's Quill moves focus to a hidden box during a paste and reads it a
    // moment later. A dispatched paste has no default action to fill it.
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    const container = document.createElement('div');
    const element = editable();
    const clipboard = document.createElement('div');
    clipboard.className = 'ql-clipboard';
    clipboard.setAttribute('contenteditable', 'true');
    container.append(element, clipboard);
    document.body.appendChild(container);
    element.addEventListener('paste', () => {
      clipboard.focus();
    });

    const text = '\tfirst <a> & b\n\nlast';
    expect(insertText({ kind: 'contenteditable', element }, text)).toBe(true);

    const rows = [...clipboard.children].map((p) => p.textContent);
    expect(rows).toEqual(['\tfirst <a> & b', '', 'last']);
    expect(clipboard.children[1]?.innerHTML).toBe('<br>');
    expect(exec).not.toHaveBeenCalled();
  });

  it('does not paste twice when the editor inserts without saying so', () => {
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    const element = editable();
    element.addEventListener('paste', () => {
      element.textContent = 'inserted';
    });

    expect(insertText({ kind: 'contenteditable', element }, 'hello')).toBe(true);
    expect(exec).not.toHaveBeenCalled();
  });

  it('falls back to execCommand when the editor ignores the paste', () => {
    // It still goes through the browser's editing pipeline, so the editor
    // sees the beforeinput/input pair and updates its own model.
    const exec = vi.fn(() => true);
    document.execCommand = exec;

    const element = editable();
    expect(insertText({ kind: 'contenteditable', element }, 'hello')).toBe(true);
    expect(exec).toHaveBeenCalledWith('insertText', false, 'hello');
  });

  it('falls back to a range insertion when execCommand refuses', () => {
    document.execCommand = vi.fn(() => false);

    const element = editable();
    const range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const onInput = vi.fn();
    element.addEventListener('input', onInput);

    expect(insertText({ kind: 'contenteditable', element }, 'fallback')).toBe(true);
    expect(element.textContent).toContain('fallback');
    expect(onInput).toHaveBeenCalledOnce();
  });

  it('reports failure rather than guessing when there is no caret', () => {
    document.execCommand = vi.fn(() => false);
    window.getSelection()?.removeAllRanges();

    expect(insertText({ kind: 'contenteditable', element: editable() }, 'x')).toBe(false);
  });
});

describe('captureSelection', () => {
  it('restores a field caret that was lost to the modal', () => {
    const element = document.createElement('textarea');
    document.body.appendChild(element);
    element.value = 'abcdef';
    element.setSelectionRange(3, 3);

    const snapshot = captureSelection({ kind: 'value', element });
    element.setSelectionRange(0, 0);
    snapshot.restore();

    expect(element.selectionStart).toBe(3);
  });

  it('restores a selection range, not just a caret', () => {
    const element = document.createElement('textarea');
    document.body.appendChild(element);
    element.value = 'abcdef';
    element.setSelectionRange(1, 4);

    const snapshot = captureSelection({ kind: 'value', element });
    element.setSelectionRange(6, 6);
    snapshot.restore();

    expect([element.selectionStart, element.selectionEnd]).toEqual([1, 4]);
  });

  it('returns focus to the editor', () => {
    const element = editable();
    const snapshot = captureSelection({ kind: 'contenteditable', element });

    const other = document.createElement('input');
    document.body.appendChild(other);
    other.focus();

    snapshot.restore();
    expect(document.activeElement).toBe(element);
  });
});
