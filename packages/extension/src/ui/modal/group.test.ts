import { scanText } from '@safeprompt/core';
import { describe, expect, it } from 'vitest';
import { groupFindings } from './group';

describe('groupFindings', () => {
  it('collapses the parts of one connection string into one row', () => {
    const { findings } = scanText('postgres://svc:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders');
    const groups = groupFindings(findings);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.name).toBe('Database connection string');
    expect(groups[0]?.count).toBe(4);
    expect(groups[0]?.parts).toContain('Database password');
  });

  it('takes the severity of the worst part', () => {
    const { findings } = scanText('postgres://svc:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders');
    expect(groupFindings(findings)[0]?.severity).toBe('critical');
  });

  it('puts the most serious group first', () => {
    const { findings } = scanText('mail dana@acme.io, key AKIA2E0RZXQ7MLPKWV3B, host 10.0.4.17');

    expect(groupFindings(findings).map((g) => g.detectorId)).toEqual([
      'cloud-token',
      'private-ip',
      'email',
    ]);
  });

  it('does not repeat the same evidence for every member', () => {
    const { findings } = scanText('a@acme.io b@acme.io c@acme.io');
    const [group] = groupFindings(findings);

    expect(group?.count).toBe(3);
    expect(group?.evidence).toHaveLength(1);
  });

  it('returns nothing for no findings', () => {
    expect(groupFindings([])).toEqual([]);
  });
});
