import { describe, expect, it } from 'vitest';
import { resolveAdapter } from './index';

const adapterFor = (href: string): string => resolveAdapter(new URL(href)).id;

describe('resolveAdapter', () => {
  it('picks the adapter for each supported site', () => {
    expect(adapterFor('https://chatgpt.com/c/abc')).toBe('chatgpt');
    expect(adapterFor('https://chat.openai.com/')).toBe('chatgpt');
    expect(adapterFor('https://claude.ai/chat/123')).toBe('claude');
    expect(adapterFor('https://gemini.google.com/app')).toBe('gemini');
  });

  it('ignores the path and query when matching', () => {
    expect(adapterFor('https://claude.ai/new?q=1#x')).toBe('claude');
  });

  it('does not match a lookalike hostname', () => {
    // chatgpt.com.evil.test ends with the right label but is not the site.
    expect(adapterFor('https://chatgpt.com.evil.test/')).toBe('generic');
    expect(adapterFor('https://notclaude.ai/')).toBe('generic');
  });

  it('falls back to the generic adapter elsewhere', () => {
    expect(adapterFor('https://example.com/')).toBe('generic');
  });
});
