import fc from 'fast-check';
import type { Finding, Severity } from '../types';

/**
 * Small on purpose — repeated substrings stress token allocation, and a wide
 * alphabet makes them vanishingly rare. No brackets, or generated text could
 * look like a token rehydration inserted.
 */
const CHARS = [...'ab01 .@-'];

const SEVERITIES: readonly Severity[] = ['low', 'medium', 'high', 'critical'];
const DETECTOR_IDS = ['alpha', 'beta', 'gamma'] as const;

const randomText = fc
  .array(fc.constantFrom(...CHARS), { minLength: 1, maxLength: 40 })
  .map((chars) => chars.join(''));

/** Random text almost never repeats itself. */
const repetitiveText = fc
  .tuple(
    fc.array(fc.constantFrom(...CHARS), { minLength: 1, maxLength: 3 }).map((c) => c.join('')),
    fc.integer({ min: 2, max: 12 }),
  )
  .map(([unit, times]) => unit.repeat(times));

export const textArb: fc.Arbitrary<string> = fc.oneof(randomText, repetitiveText);

function makeFinding(detectorId: string, start: number, end: number, severity: Severity): Finding {
  return {
    detectorId,
    category: 'secret',
    severity,
    confidence: 1,
    span: { start, end },
    label: `${detectorId} finding`,
    evidence: ['generated'],
    redaction: { placeholder: detectorId.toUpperCase() },
  };
}

/** Findings whose spans are guaranteed to fall inside `text`. */
export function findingsArb(text: string): fc.Arbitrary<Finding[]> {
  const limit = text.length;

  return fc.array(
    fc
      .record({
        start: fc.integer({ min: 0, max: limit - 1 }),
        // Long spans swallow each other during resolution, leaving one
        // survivor and exercising nothing.
        length: fc.integer({ min: 1, max: Math.min(limit, 6) }),
        severity: fc.constantFrom(...SEVERITIES),
        detectorId: fc.constantFrom(...DETECTOR_IDS),
      })
      .map(({ start, length, severity, detectorId }) =>
        makeFinding(detectorId, start, Math.min(limit, start + length), severity),
      ),
    { maxLength: 8 },
  );
}

/** A text paired with findings that index into it. */
export const textWithFindingsArb: fc.Arbitrary<[string, Finding[]]> = textArb.chain((text) =>
  fc.tuple(fc.constant(text), findingsArb(text)),
);
