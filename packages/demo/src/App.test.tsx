import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { SAMPLES } from './samples';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<App />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

const button = (label: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll('button')].find((b) => b.textContent === label);

const sample = (id: string): HTMLButtonElement | undefined => {
  const label = SAMPLES.find((s) => s.id === id)?.label;
  return [...container.querySelectorAll('button')].find((b) => b.textContent === label);
};

describe('demo', () => {
  it('opens on a sample that has findings', () => {
    expect(container.textContent).toContain('Critical risk');
    expect(container.querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('highlights exactly the flagged text', () => {
    const marked = [...container.querySelectorAll('mark')].map((m) => m.textContent);
    expect(marked).toContain('Hq7Kd0Lm2Pn9');
    expect(marked).not.toContain('DATABASE_URL');
  });

  it('switches to the redacted text, which never shows the original secret', () => {
    act(() => {
      button('As it would be sent')?.click();
    });

    const sent = container.querySelector('pre')?.textContent ?? '';
    expect(sent).toContain('[DB_PASSWORD_1]');
    expect(sent).not.toContain('Hq7Kd0Lm2Pn9');
    expect(button('As it would be sent')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('emphasises one detector when its note is hovered', () => {
    const note = container.querySelector('.notes li');
    act(() => {
      note?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(container.querySelector('.sheet')?.hasAttribute('data-hot')).toBe(true);
    expect(container.querySelectorAll('mark.hot').length).toBeGreaterThan(0);
  });

  it('stays quiet on the README sample', () => {
    act(() => {
      sample('readme')?.click();
    });

    expect(container.textContent).toContain('Nothing sensitive found');
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });

  it('marks which sample is showing', () => {
    act(() => {
      sample('trace')?.click();
    });

    expect(sample('trace')?.getAttribute('aria-pressed')).toBe('true');
    expect(sample('env')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('reports how long the scan took', () => {
    expect(container.textContent).toMatch(/Scanned [\d,]+ characters in [\d.]+ ms/);
  });
});
