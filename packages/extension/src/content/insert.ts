import type { PasteTarget } from './adapters/types';

/**
 * Showing the modal takes focus, which destroys the caret we are supposed to
 * paste at. The position is captured while the paste event is still running and
 * put back before inserting.
 */
export interface SelectionSnapshot {
  restore(): void;
}

export function captureSelection(target: PasteTarget): SelectionSnapshot {
  if (target.kind === 'value') {
    const { element } = target;
    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? start;

    return {
      restore() {
        element.focus();
        element.setSelectionRange(start, end);
      },
    };
  }

  const { element } = target;
  const range = window.getSelection()?.rangeCount
    ? window.getSelection()?.getRangeAt(0).cloneRange()
    : undefined;

  return {
    restore() {
      element.focus();
      if (range === undefined) return;

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    },
  };
}

/**
 * React tracks an input's value through its own property descriptor, so
 * assigning `element.value` leaves the component's state stale and the next
 * render throws the text away. Going through the prototype's setter is what
 * makes React notice.
 */
function setValue(element: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;

  // Taking the setter off the prototype is the whole point here, and it is
  // invoked with an explicit receiver below.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (setter === undefined) {
    element.value = value;
  } else {
    setter.call(element, value);
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertIntoValue(element: HTMLTextAreaElement | HTMLInputElement, text: string): boolean {
  const start = element.selectionStart ?? element.value.length;
  const end = element.selectionEnd ?? start;

  setValue(element, element.value.slice(0, start) + text + element.value.slice(end));
  element.setSelectionRange(start + text.length, start + text.length);

  return true;
}

/**
 * Deprecated, and still the right tool: it is the only call that inserts at the
 * caret through the browser's own editing pipeline, so ProseMirror, Lexical and
 * Quill all see the `beforeinput`/`input` pair they expect and update their
 * internal model. Writing to the DOM directly desynchronises that model, and
 * the editor throws the text away on its next render.
 */
function insertIntoEditable(element: HTMLElement, text: string): boolean {
  if (
    typeof document.execCommand === 'function' &&
    document.execCommand('insertText', false, text)
  ) {
    return true;
  }

  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
  if (range === undefined) return false;

  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);

  element.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }),
  );

  return true;
}

/** Returns false if the text could not be inserted, so the caller can recover. */
export function insertText(target: PasteTarget, text: string): boolean {
  return target.kind === 'value'
    ? insertIntoValue(target.element, text)
    : insertIntoEditable(target.element, text);
}
