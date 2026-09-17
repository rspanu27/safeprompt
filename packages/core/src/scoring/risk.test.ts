import { describe, expect, it } from 'vitest';
import { assessRisk } from './risk';
import type { Finding, Severity } from '../types';

let cursor = 0;

function finding(severity: Severity, detectorId: string = severity): Finding {
  const start = cursor;
  cursor += 10;
  return {
    detectorId,
    category: 'secret',
    severity,
    confidence: 1,
    span: { start, end: start + 5 },
    label: `${detectorId} finding`,
    evidence: ['test'],
    redaction: { placeholder: 'X' },
  };
}

function repeat(severity: Severity, count: number): Finding[] {
  return Array.from({ length: count }, () => finding(severity));
}

describe('assessRisk', () => {
  it('scores an empty scan as zero', () => {
    const risk = assessRisk([]);
    expect(risk.score).toBe(0);
    expect(risk.level).toBe('low');
    expect(risk.breakdown).toHaveLength(0);
  });

  it('puts a single critical finding in the critical band', () => {
    expect(assessRisk([finding('critical')]).level).toBe('critical');
  });

  it('treats one low finding as low risk', () => {
    expect(assessRisk([finding('low')]).level).toBe('low');
  });

  it('compounds several medium findings into a higher band', () => {
    const one = assessRisk([finding('medium', 'a')]);
    const several = assessRisk([
      finding('medium', 'a'),
      finding('medium', 'b'),
      finding('medium', 'c'),
    ]);

    expect(one.level).toBe('medium');
    expect(several.score).toBeGreaterThan(one.score);
    expect(several.level).toBe('high');
  });

  it('does not let repetition of one low detector reach the top band', () => {
    const risk = assessRisk(repeat('low', 20));
    expect(risk.level).not.toBe('critical');
  });

  it('ranks one critical finding above many low ones', () => {
    const critical = assessRisk([finding('critical')]);
    const many = assessRisk(repeat('low', 20));
    expect(critical.score).toBeGreaterThan(many.score);
  });

  it('never exceeds 100', () => {
    expect(assessRisk(repeat('critical', 50)).score).toBe(100);
  });

  it('groups the breakdown by detector and counts occurrences', () => {
    const risk = assessRisk([
      finding('high', 'jwt'),
      finding('high', 'jwt'),
      finding('low', 'email'),
    ]);

    const jwt = risk.breakdown.find((entry) => entry.detectorId === 'jwt');
    expect(jwt?.count).toBe(2);
    expect(risk.breakdown).toHaveLength(2);
  });

  it('orders the breakdown by contribution so the UI can explain itself', () => {
    const risk = assessRisk([finding('low', 'email'), finding('critical', 'private-key')]);
    expect(risk.breakdown[0]?.detectorId).toBe('private-key');
  });
});
