import { describe, expect, it } from 'vitest';
import { privateIpDetector } from './private-ip';

const detect = (text: string) => privateIpDetector.detect({ text, context: 'plain-text' });
const values = (text: string) => detect(text).map((f) => text.slice(f.span.start, f.span.end));

describe('privateIpDetector', () => {
  it('finds addresses in each private range', () => {
    expect(values('10.1.2.3 172.16.0.1 192.168.1.1 169.254.1.1')).toEqual([
      '10.1.2.3',
      '172.16.0.1',
      '192.168.1.1',
      '169.254.1.1',
    ]);
  });

  it('ignores loopback, which appears in every tutorial', () => {
    expect(detect('bound to 127.0.0.1:8080')).toHaveLength(0);
  });

  it('names the range it matched', () => {
    const [finding] = detect('host 192.168.0.42');
    expect(finding?.evidence).toContain('Falls inside 192.168.0.0/16');
  });

  it('excludes the public part of 172', () => {
    expect(detect('172.15.0.1 and 172.32.0.1')).toHaveLength(0);
    expect(values('172.20.0.1')).toEqual(['172.20.0.1']);
  });

  it('ignores public addresses', () => {
    expect(detect('8.8.8.8 and 1.1.1.1')).toHaveLength(0);
  });

  it('rejects octets above 255', () => {
    expect(detect('10.0.0.999')).toHaveLength(0);
    expect(detect('999.168.1.1')).toHaveLength(0);
  });

  it('rejects leading zeroes, which are not a valid dotted quad', () => {
    expect(detect('010.0.0.1')).toHaveLength(0);
  });

  it('ignores version numbers outside private ranges', () => {
    expect(detect('upgraded from 4.18.2.1 to 5.0.0.2')).toHaveLength(0);
  });
});
