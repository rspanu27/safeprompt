import { scanText } from '@safeprompt/core';
import { afterEach, describe, expect, it } from 'vitest';
import { historyEntry } from '../../history/history';
import { memoryArea, type StorageArea } from '../../storage/area';
import { blur, choose, click, control, mount, settle, typeInto, type Mounted } from '../testing';
import { Options } from './Options';

const SECRET = 'DATABASE_URL=postgres://svc:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders';
let mounted: Mounted | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

async function open(history: StorageArea = memoryArea(), settings: StorageArea = memoryArea()) {
  mounted = await mount(<Options settingsArea={settings} historyArea={history} />);
  return { container: mounted.container, settings, history };
}

describe('Options', () => {
  it('changes the threshold', async () => {
    const { container, settings } = await open();
    const select = container.querySelector('select');
    if (select === null) throw new Error('no threshold control');

    choose(select, 'critical');
    await settle();

    expect(await settings.get('settings')).toMatchObject({ threshold: 'critical' });
  });

  it('turns a category off', async () => {
    const { container, settings } = await open();

    click(control(container, 'Personal data'));
    await settle();

    expect(await settings.get('settings')).toMatchObject({ categories: { pii: false } });
  });

  it('lists the detectors under each category', async () => {
    const { container } = await open();
    expect(control(container, 'Credentials and tokens')?.closest('label')?.textContent).toContain(
      'Database connection string',
    );
  });

  it('hides categories nothing detects', async () => {
    const { container } = await open();
    expect(container.textContent).not.toContain('Diagnostics');
  });

  it('pauses a site', async () => {
    const { container, settings } = await open();

    click(control(container, 'ChatGPT'));
    await settle();

    expect(await settings.get('settings')).toMatchObject({ sites: { chatgpt: false } });
  });

  it('saves the allowlist when editing finishes', async () => {
    const { container, settings } = await open();
    const box = container.querySelector('textarea');
    if (box === null) throw new Error('no allowlist');

    typeInto(box, '*.staging.internal\n\n  test-key-1234  ');
    blur(box);
    await settle();

    expect(await settings.get('settings')).toMatchObject({
      allowlist: ['*.staging.internal', 'test-key-1234'],
    });
  });

  it('warns about a pattern that would match almost anything', async () => {
    const { container } = await open();
    const box = container.querySelector('textarea');
    if (box === null) throw new Error('no allowlist');

    typeInto(box, '*');

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('will be ignored');
  });

  it('shows history without any of the pasted text', async () => {
    const history = memoryArea({
      history: [historyEntry(scanText(SECRET), 'claude', 'redacted', Date.UTC(2026, 8, 18))],
    });
    const { container } = await open(history);

    const table = container.querySelector('table')?.textContent ?? '';
    expect(table).toContain('Claude');
    expect(table).toContain('Sent redacted');
    expect(table).not.toContain('Hq7Kd0Lm2Pn9');
  });

  it('clears history', async () => {
    const history = memoryArea({
      history: [historyEntry(scanText(SECRET), 'claude', 'cancelled')],
    });
    const { container } = await open(history);

    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Clear history'));
    await settle();

    expect(await history.get('history')).toBeUndefined();
    expect(container.textContent).toContain('No held pastes yet.');
  });

  it('turns history recording off', async () => {
    const { container, settings } = await open();

    click(control(container, 'Keep a record'));
    await settle();

    expect(await settings.get('settings')).toMatchObject({ history: false });
  });
});
