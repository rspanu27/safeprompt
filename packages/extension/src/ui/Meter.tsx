import { SEVERITY_RANK, type Severity } from '@safeprompt/core';

const STEPS = [1, 2, 3, 4] as const;

/**
 * Four segments, filled up to the level. Decorative: the level is always
 * written out next to it, so screen readers skip it.
 */
export function Meter({ level }: { readonly level: Severity }) {
  const filled = SEVERITY_RANK[level] + 1;

  return (
    <span className="meter" data-level={level} aria-hidden="true">
      {STEPS.map((step) => (
        <i key={step} className={step <= filled ? 'on' : undefined} />
      ))}
    </span>
  );
}
