import {
  DETECTORS,
  type Category,
  type ContentContext,
  type Detector,
  type Severity,
} from '@safeprompt/core';
import type { SiteId } from '../settings/schema';

export const LEVEL_NAMES: Record<Severity, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  critical: 'Critical risk',
};

/** Reads after "looks like". */
export const CONTEXT_PHRASES: Record<ContentContext, string> = {
  'source-code': 'source code',
  'env-file': 'an env file',
  'stack-trace': 'a stack trace',
  json: 'JSON',
  sql: 'SQL',
  log: 'a log',
  'plain-text': 'plain text',
};

export const SITE_NAMES: Record<SiteId, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

/** Display name for a recorded site id, which may predate the current list. */
export function siteName(id: string): string {
  return id in SITE_NAMES ? SITE_NAMES[id as SiteId] : id;
}

export const CATEGORY_NAMES: Record<Category, string> = {
  secret: 'Secrets and API keys',
  credential: 'Credentials and tokens',
  pii: 'Personal data',
  infrastructure: 'Internal infrastructure',
  diagnostic: 'Diagnostics',
};

export const THRESHOLD_OPTIONS: readonly { value: Severity; label: string }[] = [
  { value: 'low', label: 'Anything sensitive, including a lone email address' },
  {
    value: 'medium',
    label: 'Personal data in logs, internal infrastructure, and anything worse (recommended)',
  },
  { value: 'high', label: 'Secrets, tokens and credentials' },
  { value: 'critical', label: 'Only private keys and live credentials' },
];

export const ACTION_NAMES = {
  redacted: 'Sent redacted',
  original: 'Sent original',
  cancelled: 'Cancelled',
} as const;

/**
 * Only categories something actually detects. A toggle that does nothing is
 * worse than no toggle.
 */
export const DETECTORS_BY_CATEGORY: readonly (readonly [Category, readonly Detector[]])[] = (
  Object.keys(CATEGORY_NAMES) as Category[]
)
  .map((category) => [category, DETECTORS.filter((d) => d.category === category)] as const)
  .filter(([, detectors]) => detectors.length > 0);
