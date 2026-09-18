import { describe, expect, it } from 'vitest';
import { allowlistPatternProblem, compileAllowlist } from './allowlist';

describe('compileAllowlist', () => {
  it('matches an exact value', () => {
    const allowed = compileAllowlist(['staging-db.internal']);
    expect(allowed('staging-db.internal')).toBe(true);
    expect(allowed('prod-db.internal')).toBe(false);
  });

  it('treats * as any run of characters', () => {
    const allowed = compileAllowlist(['*.staging.internal']);
    expect(allowed('api.staging.internal')).toBe(true);
    expect(allowed('api.prod.internal')).toBe(false);
  });

  it('matches the whole value, not a substring', () => {
    expect(compileAllowlist(['test-key'])('my-test-key-2')).toBe(false);
  });

  it('gives no other character special meaning', () => {
    const allowed = compileAllowlist(['10.0.0.1']);
    expect(allowed('10.0.0.1')).toBe(true);
    expect(allowed('10x0y0z1')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(compileAllowlist(['TestKey'])('testkey')).toBe(false);
  });

  it('ignores patterns too broad to be intended', () => {
    const allowed = compileAllowlist(['*', 'a*', '**']);
    expect(allowed('AKIA2E0RZXQ7MLPKWV3B')).toBe(false);
  });

  it('allows nothing when the list is empty', () => {
    expect(compileAllowlist([])('anything')).toBe(false);
  });
});

describe('allowlistPatternProblem', () => {
  it('accepts a specific pattern', () => {
    expect(allowlistPatternProblem('*.staging.internal')).toBeNull();
  });

  it('rejects a pattern that would match nearly everything', () => {
    expect(allowlistPatternProblem('*')).not.toBeNull();
    expect(allowlistPatternProblem('ab*')).not.toBeNull();
  });

  it('rejects an empty pattern', () => {
    expect(allowlistPatternProblem('   ')).not.toBeNull();
  });
});
