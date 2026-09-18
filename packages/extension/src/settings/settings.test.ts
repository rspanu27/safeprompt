import { describe, expect, it } from 'vitest';
import { memoryArea } from '../storage/area';
import { policyFor } from './policy';
import { DEFAULT_SETTINGS, parseSettings } from './schema';
import { createSettingsCache, loadSettings, saveSettings } from './store';

describe('parseSettings', () => {
  it('falls back to defaults when nothing is stored', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults for something that is not an object', () => {
    expect(parseSettings('corrupted')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields when one field is corrupt', () => {
    const parsed = parseSettings({ enabled: false, threshold: 'extreme' });

    expect(parsed.enabled).toBe(false);
    expect(parsed.threshold).toBe(DEFAULT_SETTINGS.threshold);
  });

  it('fills in fields added since the settings were saved', () => {
    const parsed = parseSettings({ enabled: false });
    expect(parsed.sites).toEqual(DEFAULT_SETTINGS.sites);
    expect(parsed.allowlist).toEqual([]);
  });

  it('repairs a single bad toggle without resetting its neighbours', () => {
    const parsed = parseSettings({ categories: { pii: false, secret: 'yes' } });

    expect(parsed.categories.pii).toBe(false);
    expect(parsed.categories.secret).toBe(true);
  });

  it('drops keys it does not know', () => {
    expect(parseSettings({ surprise: 1 })).not.toHaveProperty('surprise');
  });
});

describe('settings store', () => {
  it('round-trips through storage', async () => {
    const area = memoryArea();
    await saveSettings(area, { ...DEFAULT_SETTINGS, threshold: 'high' });

    expect((await loadSettings(area)).threshold).toBe('high');
  });

  it('validates on the way in as well as out', async () => {
    const area = memoryArea();
    await saveSettings(area, { ...DEFAULT_SETTINGS, threshold: 'bogus' as 'high' });

    expect(await area.get('settings')).toMatchObject({ threshold: DEFAULT_SETTINGS.threshold });
  });
});

describe('createSettingsCache', () => {
  it('answers with defaults before storage has replied', () => {
    const cache = createSettingsCache(memoryArea({ settings: { enabled: false } }));
    expect(cache.current().enabled).toBe(true);
    cache.dispose();
  });

  it('picks up stored settings once loaded', async () => {
    const cache = createSettingsCache(memoryArea({ settings: { enabled: false } }));
    await cache.ready;

    expect(cache.current().enabled).toBe(false);
    cache.dispose();
  });

  it('follows changes made elsewhere, such as the options page', async () => {
    const area = memoryArea();
    const cache = createSettingsCache(area);
    await cache.ready;

    await saveSettings(area, { ...DEFAULT_SETTINGS, threshold: 'critical' });
    expect(cache.current().threshold).toBe('critical');
    cache.dispose();
  });

  it('does not let a slow initial load overwrite a newer change', async () => {
    const area = memoryArea({ settings: { threshold: 'low' } });
    const cache = createSettingsCache(area);

    await saveSettings(area, { ...DEFAULT_SETTINGS, threshold: 'critical' });
    await cache.ready;

    expect(cache.current().threshold).toBe('critical');
    cache.dispose();
  });

  it('keeps protection on if storage fails', async () => {
    const area = memoryArea();
    area.get = () => Promise.reject(new Error('storage unavailable'));

    const cache = createSettingsCache(area);
    await cache.ready;

    expect(cache.current().enabled).toBe(true);
    cache.dispose();
  });
});

describe('policyFor', () => {
  it('is active by default on a supported site', () => {
    expect(policyFor(DEFAULT_SETTINGS, 'claude').active).toBe(true);
  });

  it('is inactive when protection is switched off', () => {
    expect(policyFor({ ...DEFAULT_SETTINGS, enabled: false }, 'claude').active).toBe(false);
  });

  it('is inactive on a site the user paused', () => {
    const settings = { ...DEFAULT_SETTINGS, sites: { ...DEFAULT_SETTINGS.sites, gemini: false } };

    expect(policyFor(settings, 'gemini').active).toBe(false);
    expect(policyFor(settings, 'claude').active).toBe(true);
  });

  it('passes only enabled categories to the scanner', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      categories: { ...DEFAULT_SETTINGS.categories, pii: false },
    };

    expect(policyFor(settings, 'claude').scan.categories).not.toContain('pii');
  });

  it('passes the allowlist through', () => {
    const settings = { ...DEFAULT_SETTINGS, allowlist: ['*.staging.internal'] };
    expect(policyFor(settings, 'claude').scan.allowlist).toEqual(['*.staging.internal']);
  });
});
