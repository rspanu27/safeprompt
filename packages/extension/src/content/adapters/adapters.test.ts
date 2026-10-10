import { beforeEach, describe, expect, it } from 'vitest';
import { ADAPTERS, resolveAdapter } from './index';
import type { SiteAdapter } from './types';

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

describe('hasComposer', () => {
  const adapter = (id: string): SiteAdapter => {
    const found = ADAPTERS.find((a) => a.id === id);
    if (found === undefined) throw new Error(`no adapter ${id}`);
    return found;
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('is false on a page with no message box', () => {
    document.body.innerHTML = '<input type="search" /><textarea name="notes"></textarea>';

    expect(adapter('chatgpt').hasComposer(document)).toBe(false);
    expect(adapter('claude').hasComposer(document)).toBe(false);
    expect(adapter('gemini').hasComposer(document)).toBe(false);
  });

  it('finds the ChatGPT message box, signed in and signed out', () => {
    document.body.innerHTML = '<div id="prompt-textarea" contenteditable="true"></div>';
    expect(adapter('chatgpt').hasComposer(document)).toBe(true);

    document.body.innerHTML = '<textarea name="prompt"></textarea>';
    expect(adapter('chatgpt').hasComposer(document)).toBe(true);
  });

  it('finds the Claude message box', () => {
    document.body.innerHTML = '<div class="ProseMirror" contenteditable="true"></div>';
    expect(adapter('claude').hasComposer(document)).toBe(true);
  });

  it('finds the Gemini message box', () => {
    document.body.innerHTML =
      '<rich-textarea><div class="ql-editor" contenteditable="true"></div></rich-textarea>';
    expect(adapter('gemini').hasComposer(document)).toBe(true);
  });

  it('is always true for the generic adapter, which accepts any field', () => {
    expect(adapter('generic').hasComposer(document)).toBe(true);
  });
});
