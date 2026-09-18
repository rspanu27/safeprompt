import { z } from 'zod';

export const SITES = ['chatgpt', 'claude', 'gemini'] as const;
export type SiteId = (typeof SITES)[number];

const severity = z.enum(['low', 'medium', 'high', 'critical']);

const categories = z.object({
  secret: z.boolean().catch(true),
  credential: z.boolean().catch(true),
  pii: z.boolean().catch(true),
  infrastructure: z.boolean().catch(true),
  diagnostic: z.boolean().catch(true),
});

const sites = z.object({
  chatgpt: z.boolean().catch(true),
  claude: z.boolean().catch(true),
  gemini: z.boolean().catch(true),
});

export const DEFAULT_SETTINGS = {
  version: 1 as const,
  enabled: true,
  // A lone email address in prose is not worth interrupting a paste for. The
  // same address in a log is raised to medium by context, and is held.
  threshold: 'medium' as const,
  categories: {
    secret: true,
    credential: true,
    pii: true,
    infrastructure: true,
    diagnostic: true,
  },
  sites: { chatgpt: true, claude: true, gemini: true },
  allowlist: [] as string[],
  history: true,
};

/**
 * Every field falls back to its default on its own.
 *
 * Stored settings can be written by an older version, edited by hand, or cut
 * short by a sync conflict. One bad field should cost the user that one field,
 * not reset everything they configured.
 */
export const settingsSchema = z
  .object({
    version: z.literal(1).catch(1),
    enabled: z.boolean().catch(DEFAULT_SETTINGS.enabled),
    threshold: severity.catch(DEFAULT_SETTINGS.threshold),
    categories: categories.catch(DEFAULT_SETTINGS.categories),
    sites: sites.catch(DEFAULT_SETTINGS.sites),
    allowlist: z.array(z.string().max(200)).max(100).catch([]),
    history: z.boolean().catch(DEFAULT_SETTINGS.history),
  })
  .catch(DEFAULT_SETTINGS);

export type Settings = z.infer<typeof settingsSchema>;

export function parseSettings(raw: unknown): Settings {
  return settingsSchema.parse(raw ?? {});
}
