import { scanText } from '@safeprompt/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { historyEntry } from '../../history/history';
import type { SiteId } from '../../settings/schema';
import { memoryArea, type StorageArea } from '../../storage/area';
import { click, control, mount, settle, type Mounted } from '../testing';
import { Popup } from './Popup';

const NOW = 10_000_000_000;
let mounted: Mounted | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

async function open(
  options: {
    site?: SiteId | null;
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
