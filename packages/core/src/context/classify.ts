import type { ContentContext } from '../types';

/**
 * Determine what kind of content the input is. Severity depends on it — an
 * email in prose is not an email in a production log.
 *
 * Stub for now. Real classification lands in Phase 5, once the evaluation
 * harness can show it improves precision rather than just moving numbers.
 */
export function classifyContext(_text: string): ContentContext {
  return 'plain-text';
}
