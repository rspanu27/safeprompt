import { describe, expect, it } from 'vitest';
import { applyContext } from './severity';
import type { Category, Finding, Severity } from '../types';

function finding(category: Category, severity: Severity): Finding {
  return {
    detectorId: 'test',
    category,
    severity,
    confidence: 1,
    span: { start: 0, end: 4 },
    label: 'Test finding',
    evidence: ['base'],
    redaction: { placeholder: 'X' },
  };
}

describe('applyContext', () => {
  it('raises PII found in a log', () => {
    const [adjusted] = applyContext([finding('pii', 'low')], 'log');
    expect(adjusted?.severity).toBe('medium');
  });

  it('raises infrastructure found in a stack trace', () => {
    const [adjusted] = applyContext([finding('infrastructure', 'medium')], 'stack-trace');
    expect(adjusted?.severity).toBe('high');
  });

  it('leaves PII in prose alone', () => {
    const [adjusted] = applyContext([finding('pii', 'low')], 'plain-text');
    expect(adjusted?.severity).toBe('low');
  });

  it('never lowers a finding', () => {
    for (const context of ['log', 'source-code', 'json', 'sql', 'plain-text'] as const) {
      const [adjusted] = applyContext([finding('secret', 'critical')], context);
      expect(adjusted?.severity).toBe('critical');
    }
  });

  it('cannot raise past critical', () => {
    const [adjusted] = applyContext([finding('infrastructure', 'critical')], 'log');
    expect(adjusted?.severity).toBe('critical');
  });

  it('records why a finding was raised', () => {
    const [adjusted] = applyContext([finding('pii', 'low')], 'log');
    expect(adjusted?.evidence).toHaveLength(2);
    expect(adjusted?.evidence[1]).toContain('Raised to medium');
  });

  it('leaves evidence untouched when nothing changes', () => {
    const [adjusted] = applyContext([finding('secret', 'high')], 'plain-text');
    expect(adjusted?.evidence).toEqual(['base']);
  });

  it('adjusts each finding independently', () => {
    const adjusted = applyContext([finding('pii', 'low'), finding('secret', 'low')], 'log');
    expect(adjusted.map((f) => f.severity)).toEqual(['medium', 'low']);
  });
});
