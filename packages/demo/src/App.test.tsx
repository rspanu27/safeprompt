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

const sample = (id: string): HTMLButtonElement | undefined => {
  const label = SAMPLES.find((s) => s.id === id)?.label;
  return [...container.querySelectorAll('button')].find((b) => b.textContent === label);
};

describe('demo', () => {
  it('opens on a sample that has findings', () => {
    expect(container.textContent).toContain('critical risk');
    expect(container.querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('never shows the original secret in the redacted output', () => {
    expect(container.querySelector('pre')?.textContent).not.toContain('Hq7Kd0Lm2Pn9');
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
