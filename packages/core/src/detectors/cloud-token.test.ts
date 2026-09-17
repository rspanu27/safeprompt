import { describe, expect, it } from 'vitest';
import { cloudTokenDetector } from './cloud-token';

const detect = (text: string) => cloudTokenDetector.detect({ text, context: 'plain-text' });
const labels = (text: string) => detect(text).map((f) => f.label);

describe('cloudTokenDetector', () => {
  it('identifies an AWS access key by prefix', () => {
    expect(labels('AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B')).toEqual(['AWS access key ID']);
  });

  it('identifies GitHub, Slack and OpenAI tokens', () => {
    expect(labels('ghp_16C7e42F292c6912E7710c838347Ae178B4a')).toEqual(['GitHub token']);
    expect(labels('xoxb-2451234567-2451234567-AbCdEfGhIjKlMnOpQrStUvWx')).toEqual(['Slack token']);
    expect(labels(`sk-proj-${'B'.repeat(40)}`)).toEqual(['OpenAI API key']);
  });

  it('rates a Stripe live key above a test key', () => {
    const [live] = detect(`sk_live_${'4'.repeat(24)}`);
    const [test] = detect(`sk_test_${'4'.repeat(24)}`);

    expect(live?.severity).toBe('critical');
    expect(test?.severity).toBe('medium');
  });

  it('ignores Stripe publishable keys, which are meant to be public', () => {
    expect(detect(`pk_live_${'4'.repeat(24)}`)).toHaveLength(0);
  });

  it("ignores AWS's documented example key", () => {
    expect(detect('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE')).toHaveLength(0);
  });

  it('ignores a prefix of the wrong length', () => {
    expect(detect('AKIASHORT')).toHaveLength(0);
    expect(detect('ghp_tooshort')).toHaveLength(0);
  });

  it('ignores placeholder values in documentation', () => {
    expect(detect('token: ghp_your-token-here-xxxxxxxxxxxxxxxxxxx')).toHaveLength(0);
  });

  it('ignores a git commit hash', () => {
    expect(detect('commit 9f8c3b1d2e4a5f6b7c8d9e0f1a2b3c4d5e6f7a8b')).toHaveLength(0);
  });
});
