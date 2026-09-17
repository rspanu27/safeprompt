import { describe, expect, it } from 'vitest';
import { privateKeyDetector } from './private-key';
import { resolveOverlaps } from '../resolve/overlaps';

const detect = (text: string) => privateKeyDetector.detect({ text, context: 'plain-text' });

const RSA_BLOCK = [
  '-----BEGIN RSA PRIVATE KEY-----',
  'MIIEowIBAAKCAQEAx4fmHy6Yw1kQ0nFvKPRlpVvFQ2mZ8kXqL3nT7bJcYdWwGpAs',
  'RtZvNhKuEiMoPqLsXyBcDfGhJkLmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx',
  '-----END RSA PRIVATE KEY-----',
].join('\n');

describe('privateKeyDetector', () => {
  it('spans a complete PEM block', () => {
    const text = `key = """\n${RSA_BLOCK}\n"""`;
    const resolved = resolveOverlaps(detect(text));
    const [finding] = resolved;

    expect(resolved).toHaveLength(1);
    expect(text.slice(finding?.span.start ?? 0, finding?.span.end ?? 0)).toBe(RSA_BLOCK);
    expect(finding?.severity).toBe('critical');
  });

  it('recognises OpenSSH and EC blocks', () => {
    const openssh = '-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----';
    const ec = '-----BEGIN EC PRIVATE KEY-----\nabc\n-----END EC PRIVATE KEY-----';

    expect(resolveOverlaps(detect(openssh))).toHaveLength(1);
    expect(resolveOverlaps(detect(ec))).toHaveLength(1);
  });

  it('flags a truncated block with lower confidence', () => {
    const [finding] = detect('-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA');

    expect(finding?.confidence).toBeLessThan(1);
    expect(finding?.evidence).toContain('PEM header with no matching END marker');
  });

  it('does not match a public key block', () => {
    expect(detect('-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----')).toHaveLength(0);
  });

  it('does not match a certificate', () => {
    expect(detect('-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----')).toHaveLength(0);
  });

  it('does not match prose about private keys', () => {
    expect(detect('Never paste your private key into a chat window.')).toHaveLength(0);
  });
});
