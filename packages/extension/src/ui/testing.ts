import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

export interface Mounted {
  readonly container: HTMLElement;
  unmount(): void;
}

/** Render and let storage reads settle, so assertions see loaded state. */
export async function mount(element: ReactElement): Promise<Mounted> {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  await act(async () => {
    root.render(element);
    await Promise.resolve();
  });
  await settle();

  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/** Flush pending promise callbacks inside act. */
export async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Type into a React-controlled field the way a user would. */
export function typeInto(element: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  act(() => {
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export function choose(select: HTMLSelectElement, value: string): void {
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export function blur(element: HTMLElement): void {
  act(() => {
    element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  });
}

export function click(element: Element | null | undefined): void {
  act(() => {
    (element as HTMLElement | null | undefined)?.click();
  });
}

/** A labelled checkbox or switch, found by the visible text beside it. */
export function control(container: HTMLElement, text: string): HTMLInputElement | undefined {
  const label = [...container.querySelectorAll('label')].find(
    (l) => l.querySelector('input') !== null && l.textContent.includes(text),
  );
  return label?.querySelector('input') ?? undefined;
}
