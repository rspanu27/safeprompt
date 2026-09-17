import { describe, expect, it } from 'vitest';
import { internalHostnameDetector } from './internal-hostname';
import { resolveOverlaps } from '../resolve/overlaps';

const detect = (text: string) =>
  resolveOverlaps(internalHostnameDetector.detect({ text, context: 'plain-text' }));

const values = (text: string) => detect(text).map((f) => text.slice(f.span.start, f.span.end));

describe('internalHostnameDetector', () => {
  it('finds hosts on reserved internal suffixes', () => {
    expect(values('db.internal')).toEqual(['db.internal']);
    expect(values('mail.corp')).toEqual(['mail.corp']);
    expect(values('printer.lan')).toEqual(['printer.lan']);
  });

  it('finds Kubernetes in-cluster addresses', () => {
    expect(values('api.default.svc.cluster.local')).toEqual(['api.default.svc.cluster.local']);
  });

  it('names why it matched', () => {
    const [finding] = detect('redis.intranet');
    expect(finding?.evidence[0]).toContain('.intranet');
  });

  it('ignores public domains', () => {
    expect(detect('example.com and docs.python.org')).toHaveLength(0);
  });

  it('ignores prose', () => {
    expect(detect('The service is internal to the team.')).toHaveLength(0);
  });
});
