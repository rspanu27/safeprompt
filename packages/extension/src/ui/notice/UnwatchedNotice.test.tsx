import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTACT_EMAIL, reportUrl } from '../links';
import { click, mount, type Mounted } from '../testing';
import { UnwatchedNotice } from './UnwatchedNotice';

let mounted: Mounted | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

async function show(onDismiss: () => void = () => undefined): Promise<HTMLElement> {
  mounted = await mount(<UnwatchedNotice site="chatgpt" onDismiss={onDismiss} />);
  return mounted.container;
}

const buttonLabelled = (container: HTMLElement, name: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll('button')].find((b) => b.textContent === name);

describe('UnwatchedNotice', () => {
  it('says the paste was not checked, and names the site', async () => {
    const container = await show();

    expect(container.textContent).toContain('SafePrompt did not check that paste');
    expect(container.textContent).toContain('ChatGPT has probably changed');
  });

  it('is announced without taking focus', async () => {
    const before = document.activeElement;
    const container = await show();

    expect(container.querySelector('.notice')?.getAttribute('role')).toBe('status');
    expect(document.activeElement).toBe(before);
  });

  it('offers a report on GitHub, and an address to email', async () => {
    const container = await show();

    expect(container.querySelector('a')?.getAttribute('href')).toBe(reportUrl('chatgpt'));
    expect(buttonLabelled(container, CONTACT_EMAIL)).toBeDefined();
  });

  it('can be dismissed', async () => {
    const onDismiss = vi.fn();
    const container = await show(onDismiss);

    click(buttonLabelled(container, 'Dismiss'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('ships its own styles so it does not depend on the page', async () => {
    const container = await show();
    expect(container.querySelector('style')?.textContent).toContain('.notice');
  });
});
