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

describe('insertText into a rich-text editor', () => {
  it('goes through execCommand so the editor updates its own model', () => {
    // ProseMirror, Lexical and Quill track the document themselves. Writing to
    // the DOM behind their backs desynchronises the model and the text is
    // dropped on the next render; execCommand produces the beforeinput/input
    // pair they listen for.
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
