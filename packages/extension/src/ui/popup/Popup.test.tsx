import { scanText } from '@safeprompt/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { historyEntry } from '../../history/history';
import type { SiteId } from '../../settings/schema';
import { memoryArea, type StorageArea } from '../../storage/area';
import { click, control, mount, settle, type Mounted } from '../testing';
import { Popup, type TabStatus } from './Popup';

const NOW = 10_000_000_000;
let mounted: Mounted | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

async function open(
  options: {
    site?: SiteId | null;
    page?: TabStatus;
    settings?: StorageArea;
    history?: StorageArea;
    onOpenSettings?: () => void;
  } = {},
) {
  const settingsArea = options.settings ?? memoryArea();
  mounted = await mount(
    <Popup
      settingsArea={settingsArea}
      historyArea={options.history ?? memoryArea()}
      site={options.site === undefined ? 'claude' : options.site}
      {...(options.page === undefined ? {} : { page: options.page })}
      onOpenSettings={options.onOpenSettings ?? (() => undefined)}
      now={NOW}
    />,
  );
  return { container: mounted.container, settingsArea };
}

describe('Popup', () => {
  it('says which site it is watching', async () => {
    const { container } = await open({ site: 'claude' });
    expect(container.textContent).toContain('Watching pastes on Claude.');
  });

  it('says so when the page has no message box it recognises', async () => {
    const { container } = await open({ site: 'chatgpt', page: 'no-composer' });

    expect(container.textContent).toContain("Can't find a message box on this page");
    expect(container.textContent).not.toContain('Watching pastes');
  });

  it('offers to report it on GitHub, naming the site, or by email', async () => {
    const { container } = await open({ site: 'chatgpt', page: 'no-composer' });
    const link = container.querySelector('a');

    expect(link?.getAttribute('href')).toContain('Message%20box%20not%20found%20on%20ChatGPT');
    expect(link?.getAttribute('rel')).toContain('noreferrer');
    expect(container.textContent).toContain('or email raul.safeprompt@gmail.com');
  });

  it('asks for a reload when the tab is not running SafePrompt yet', async () => {
    const { container } = await open({ site: 'gemini', page: 'unreachable' });

    expect(container.textContent).toContain('Reload this tab to start checking pastes on Gemini.');
    expect(container.querySelector('a')).toBeNull();
  });

  it('does not warn about the page while the site is paused', async () => {
    const { container } = await open({
      site: 'claude',
      page: 'no-composer',
      settings: memoryArea({ settings: { sites: { claude: false } } }),
    });

    expect(container.textContent).toContain('Paused on Claude.');
    expect(container.querySelector('a')).toBeNull();
  });

  it('explains itself on an unsupported site', async () => {
    const { container } = await open({ site: null });

    expect(container.textContent).toContain('Open ChatGPT, Claude or Gemini');
    expect(control(container, 'On ')).toBeUndefined();
  });

  it('switches protection off everywhere', async () => {
    const { container, settingsArea } = await open();

    click(control(container, 'Protection'));
    await settle();

    expect(await settingsArea.get('settings')).toMatchObject({ enabled: false });
    expect(container.textContent).toContain('Protection is off everywhere.');
  });

  it('pauses the current site only', async () => {
    const { container, settingsArea } = await open({ site: 'gemini' });

    click(control(container, 'On Gemini'));
    await settle();

    expect(await settingsArea.get('settings')).toMatchObject({
      sites: { chatgpt: true, claude: true, gemini: false },
    });
    expect(container.textContent).toContain('Paused on Gemini.');
  });

  it('reflects settings already stored', async () => {
    const { container } = await open({
      settings: memoryArea({ settings: { enabled: false } }),
    });

    expect(control(container, 'Protection')?.checked).toBe(false);
  });

  it('summarises this week, ignoring older entries', async () => {
    const result = scanText('AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B');
    const history = memoryArea({
      history: [
        historyEntry(result, 'claude', 'redacted', NOW - 1000),
        historyEntry(result, 'claude', 'cancelled', NOW - 2000),
        historyEntry(result, 'claude', 'redacted', NOW - 30 * 24 * 60 * 60 * 1000),
      ],
    });

    const { container } = await open({ history });

    expect(container.textContent).toContain('2 pastes held this week');
    expect(container.textContent).toContain('1 sent redacted');
  });

  it('says so when nothing was held', async () => {
    const { container } = await open();
    expect(container.textContent).toContain('Nothing held this week.');
  });

  it('opens the settings page', async () => {
    const onOpenSettings = vi.fn();
    const { container } = await open({ onOpenSettings });

    click(
      [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Settings')),
    );
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});
