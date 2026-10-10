import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTACT_EMAIL, reportUrl } from './links';
import { ReportLinks } from './ReportLinks';
import { click, mount, settle, type Mounted } from './testing';

let mounted: Mounted | undefined;
const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function stubClipboard(clipboard: unknown): void {
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
}

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;

  if (original === undefined) Reflect.deleteProperty(navigator, 'clipboard');
  else Object.defineProperty(navigator, 'clipboard', original);
});

async function show(): Promise<HTMLElement> {
  mounted = await mount(
    <p>
      <ReportLinks site="chatgpt" />
    </p>,
  );
  return mounted.container;
}

describe('ReportLinks', () => {
  it('links to a GitHub issue in a new tab, without sending where the user came from', async () => {
    const container = await show();
    const link = container.querySelector('a');

    expect(link?.textContent).toBe('on GitHub');
    expect(link?.getAttribute('href')).toBe(reportUrl('chatgpt'));
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noreferrer');
  });

  it('shows the address in full, so it can be read even if nothing else works', async () => {
    const container = await show();
    expect(container.textContent).toContain(`or email ${CONTACT_EMAIL}`);
  });

  it('does not rely on a mail link, which opens nothing without a mail app', async () => {
    const container = await show();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('copies the address when it is clicked, and says so', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard({ writeText });
    const container = await show();

    click(container.querySelector('button'));
    await settle();

    expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL);
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Address copied.');
  });

  it('says nothing about copying until it has happened', async () => {
    const container = await show();
    expect(container.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('falls back to selectable text when the page refuses the clipboard', async () => {
    stubClipboard({ writeText: () => Promise.reject(new Error('denied')) });
    const container = await show();

    click(container.querySelector('button'));
    await settle();

    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('.address')?.textContent).toBe(CONTACT_EMAIL);
    expect(container.textContent).toContain('Select the address to copy it.');
  });

  it('falls back the same way when there is no clipboard at all', async () => {
    stubClipboard(undefined);
    const container = await show();

    click(container.querySelector('button'));
    await settle();

    expect(container.querySelector('.address')?.textContent).toBe(CONTACT_EMAIL);
  });
});
