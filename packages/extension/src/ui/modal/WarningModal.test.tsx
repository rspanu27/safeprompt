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

interface RenderOptions {
  redacted?: () => void;
  original?: () => void;
  cancel?: () => void;
  notice?: string;
  text?: string;
}

function render(options: RenderOptions = {}) {
  act(() => {
    root.render(
      <WarningModal
        result={scanText(options.text ?? PASTE)}
        onPasteRedacted={options.redacted ?? (() => undefined)}
        onPasteOriginal={options.original ?? (() => undefined)}
        onCancel={options.cancel ?? (() => undefined)}
        {...(options.notice === undefined ? {} : { notice: options.notice })}
      />,
    );
  });
}

const tab = (shiftKey = false): void => {
  act(() => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }),
    );
  });
};

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

  it('names what was found, including the parts of a grouped finding', () => {
    render();
    expect(container.textContent).toContain('Database connection string');
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

  it('shows one row for a connection string, not one per part', () => {
    render();
    const rows = container.querySelectorAll('li');

    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toContain('Database connection string');
  });

  it('keeps Tab inside the modal, wrapping from last to first', () => {
    render();
    expect(document.activeElement?.textContent).toBe('Paste redacted');

    tab();
    expect(document.activeElement?.textContent).toBe('Cancel');
  });

  it('wraps Shift+Tab from first to last', () => {
    render();
    tab();
    tab(true);

    expect(document.activeElement?.textContent).toBe('Paste redacted');
  });

  it('moves through the buttons in order', () => {
    render();
    tab();
    tab();

    expect(document.activeElement?.textContent).toBe('Paste original');
  });

  it('shows a notice when one is given, announced to assistive tech', () => {
    render({ notice: 'The editor did not accept the text.' });
    const notice = container.querySelector('[role="alert"]');

    expect(notice?.textContent).toBe('The editor did not accept the text.');
  });

  it('shows no notice by default', () => {
    render();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('ships its own styles so it does not depend on the page', () => {
    render();
    expect(container.querySelector('style')?.textContent).toContain('.panel');
  });
});
