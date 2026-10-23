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
 * Pastes SafePrompt dispatches itself. The interceptor lets these through, or
 * the text the user just approved would be held a second time.
 */
const ownPastes = new WeakSet<Event>();

export function isOwnPaste(event: Event): boolean {
  return ownPastes.has(event);
}

/** One `<p>` per line, the shape a browser gives pasted plain text. */
function paragraphs(text: string): HTMLElement[] {
  return text.split('\n').map((line) => {
    const p = document.createElement('p');
    if (line === '') p.appendChild(document.createElement('br'));
    else p.textContent = line;
    return p;
  });
}

/**
 * Give the text to the editor as a paste, the way the clipboard would.
 *
 * This is the fast path. Inserting with execCommand turns every line break into
 * a separate edit, and the page reacts to each one: a 650-line paste froze
 * ChatGPT long enough for Chrome to offer to kill the tab, and took over 15
 * seconds on Gemini. A paste event is a single edit however long the text is,
 * and the editor treats it exactly like the user's own paste.
 */
function pasteInto(element: HTMLElement, text: string): boolean {
  const data = new DataTransfer();
  data.setData('text/plain', text);
  const event = new ClipboardEvent('paste', {
    clipboardData: data,
    bubbles: true,
    cancelable: true,
  });
  ownPastes.add(event);

  const before = element.textContent;
  element.dispatchEvent(event);

  // ProseMirror (ChatGPT, Claude) handles the paste itself and says so.
  if (event.defaultPrevented) return true;

  // Older Quill (Gemini) moves focus to a hidden box, lets the browser paste
  // into it, and reads the box a moment later. A dispatched paste has no
  // default action, so fill the box the way the browser would.
  const holder = document.activeElement;
  if (
    holder instanceof HTMLElement &&
    holder.classList.contains('ql-clipboard') &&
    holder.parentElement?.contains(element) === true
  ) {
    holder.replaceChildren(...paragraphs(text));
    return true;
  }

  // An editor that inserted the text without saying so. Going on to the slow
  // path would paste it twice.
  return element.textContent !== before;
}

/**
 * For an editor that ignores a dispatched paste, fall back to execCommand.
 * Deprecated, but it inserts at the caret through the browser's own editing
 * pipeline, so the editor sees the `beforeinput`/`input` pair it expects and
 * updates its model. Writing to the DOM directly desynchronises that model, and
 * the editor throws the text away on its next render.
 */
function insertIntoEditable(element: HTMLElement, text: string): boolean {
  let pasted = false;
  try {
    pasted = pasteInto(element, text);
  } catch {
    // No DataTransfer or ClipboardEvent constructor. Use the slow path.
  }
  if (pasted) return true;

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
