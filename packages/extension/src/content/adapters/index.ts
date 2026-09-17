import { chatgptAdapter } from './chatgpt';
import { claudeAdapter } from './claude';
import { geminiAdapter } from './gemini';
import { genericAdapter } from './generic';
import type { SiteAdapter } from './types';

/** Ordered: the first match wins, so the generic fallback comes last. */
const ADAPTERS: readonly SiteAdapter[] = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  genericAdapter,
];

export function resolveAdapter(url: URL): SiteAdapter {
  return ADAPTERS.find((adapter) => adapter.matches(url)) ?? genericAdapter;
}

export { ADAPTERS };
export type { PasteTarget, SiteAdapter } from './types';
