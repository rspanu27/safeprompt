import { scanText } from '@safeprompt/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WarningModal } from './WarningModal';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const PASTE = 'DATABASE_URL=postgres://svc:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders';

let container: HTMLElement;
let root: Root;

function render(handlers: Partial<Record<'redacted' | 'original' | 'cancel', () => void>> = {}) {
  act(() => {
    root.render(
      <WarningModal
        result={scanText(PASTE)}
        onPasteRedacted={handlers.redacted ?? (() => undefined)}
        onPasteOriginal={handlers.original ?? (() => undefined)}
        onCancel={handlers.cancel ?? (() => undefined)}
      />,
    );
  });
}

const buttonLabelled = (name: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll('button')].find((b) => b.textContent === name);

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('WarningModal', () => {
  it('states the risk level and score', () => {
    render();
    expect(container.textContent).toContain('critical risk');
    expect(container.textContent).toContain('/100');
  });

  it('names what was found', () => {
    render();
    expect(container.textContent).toContain('Database password');
  });

  it('explains why each finding fired', () => {
    render();
    expect(container.textContent).toContain('Component of a database connection string');
  });

  it('shows the redacted text, not the original', () => {
    render();
    const preview = container.querySelector('pre')?.textContent ?? '';

    expect(preview).toContain('[DB_PASSWORD_1]');
    expect(preview).not.toContain('Hq7Kd0Lm2Pn9');
  });

  it('keeps the structure of the redacted string readable', () => {
    render();
    const preview = container.querySelector('pre')?.textContent ?? '';

    expect(preview).toContain('postgres://');
    expect(preview).toContain(':5432/');
  });

  it('offers all three choices', () => {
    render();
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent);

    expect(labels).toEqual(['Cancel', 'Paste original', 'Paste redacted']);
  });

  it('reports which choice was made', () => {
    const redacted = vi.fn();
    const original = vi.fn();
    const cancel = vi.fn();

    render({ redacted, original, cancel });

    act(() => buttonLabelled('Paste redacted')?.click());
    act(() => buttonLabelled('Paste original')?.click());
    act(() => buttonLabelled('Cancel')?.click());

    expect(redacted).toHaveBeenCalledOnce();
    expect(original).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('is announced as a dialog', () => {
    render();
    const dialog = container.querySelector('[role="dialog"]');

    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('safeprompt-title');
  });

  it('cancels on Escape', () => {
    const cancel = vi.fn();
    render({ cancel });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(cancel).toHaveBeenCalledOnce();
  });

  it('keeps Escape from reaching the page', () => {
    const page = vi.fn();
    document.addEventListener('keydown', page);
    render();

    act(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });

    expect(page).not.toHaveBeenCalled();
    document.removeEventListener('keydown', page);
  });

  it('ignores other keys', () => {
    const cancel = vi.fn();
    render({ cancel });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    });

    expect(cancel).not.toHaveBeenCalled();
  });

  it('stops listening for Escape once closed', () => {
    const cancel = vi.fn();
    render({ cancel });

    act(() => {
      root.unmount();
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(cancel).not.toHaveBeenCalled();
    root = createRoot(container);
  });

  it('cancels on a click outside the panel', () => {
    const cancel = vi.fn();
    render({ cancel });
    const backdrop = container.querySelector('.backdrop');

    act(() => {
      backdrop?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(cancel).toHaveBeenCalledOnce();
  });

  it('does not cancel on a click inside the panel', () => {
    const cancel = vi.fn();
    render({ cancel });
    const preview = container.querySelector('pre');

    act(() => {
      preview?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      preview?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(cancel).not.toHaveBeenCalled();
  });

  it('does not cancel when a text selection is dragged out of the panel', () => {
    // Pressing inside the preview and releasing over the backdrop produces a
    // click targeted at the backdrop. Throwing the paste away for that would be
    // infuriating.
    const cancel = vi.fn();
    render({ cancel });

    act(() => {
      container.querySelector('pre')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      container
        .querySelector('.backdrop')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(cancel).not.toHaveBeenCalled();
  });

  it('takes focus so typing does not reach the composer behind it', () => {
    render();
    expect(document.activeElement?.textContent).toBe('Paste redacted');
  });

  it('ships its own styles so it does not depend on the page', () => {
    render();
    expect(container.querySelector('style')?.textContent).toContain('.panel');
  });
});
