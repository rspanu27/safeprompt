import type { Category, ScanOptions, Severity } from '@safeprompt/core';
import { SITES, type Settings, type SiteId } from './schema';

/** What the interceptor needs to know for one paste on one site. */
export interface PastePolicy {
  readonly active: boolean;
  /** Pastes below this level go through untouched. */
  readonly threshold: Severity;
  readonly scan: ScanOptions;
}

const isSite = (id: string): id is SiteId => (SITES as readonly string[]).includes(id);

export function policyFor(settings: Settings, siteId: string): PastePolicy {
  const siteEnabled = isSite(siteId) ? settings.sites[siteId] : true;

  const categories = (Object.keys(settings.categories) as Category[]).filter(
    (category) => settings.categories[category],
  );

  return {
    active: settings.enabled && siteEnabled,
    threshold: settings.threshold,
    scan: { categories, allowlist: settings.allowlist },
  };
}
