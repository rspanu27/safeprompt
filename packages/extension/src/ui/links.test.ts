import { describe, expect, it } from 'vitest';
import { version } from '../../package.json';
import { reportUrl } from './links';

describe('reportUrl', () => {
  const url = new URL(reportUrl('claude'));
  const body = url.searchParams.get('body') ?? '';

  it('opens a new issue on the project, titled with the site', () => {
    expect(url.origin + url.pathname).toBe('https://github.com/rspanu27/safeprompt/issues/new');
    expect(url.searchParams.get('title')).toBe('Message box not found on Claude');
  });

  it('fills in what is already known', () => {
    expect(body).toContain(`SafePrompt version: ${version}`);
    expect(body).toContain('Site: Claude');
  });

  it('asks what a fix needs to know', () => {
    expect(body).toContain('Were you signed in?');
    expect(body).toContain('What kind of page was it?');
  });

  it('warns that issues are public', () => {
    expect(body).toContain('GitHub issues are public');
  });

  it('carries nothing about the page the user was on', () => {
    expect([...url.searchParams.keys()]).toEqual(['title', 'body']);
    expect(body).not.toMatch(/https?:/);
  });
});
