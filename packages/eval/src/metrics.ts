import type { Detector, Finding, Span } from '@safeprompt/core';
import type { Sample } from './corpus';

export interface Metrics {
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly falseNegatives: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1: number;
}

export interface FalsePositive {
  readonly detectorId: string;
  readonly sampleId: string;
  readonly label: string;
  readonly matched: string;
}

export interface Miss {
  readonly detectorId: string;
  readonly sampleId: string;
  readonly value: string;
}

export interface DetectorResult extends Metrics {
  readonly detectorId: string;
  readonly description: string;
}

export interface Evaluation {
  readonly detectors: readonly DetectorResult[];
  readonly overall: Metrics;
  readonly sampleCount: number;
  readonly positiveCount: number;
  readonly negativeCount: number;
  readonly falsePositives: readonly FalsePositive[];
  readonly misses: readonly Miss[];
}

/** Every position at which `value` occurs in `text`. */
function occurrences(text: string, value: string): Span[] {
  const spans: Span[] = [];
  let from = 0;

  for (;;) {
    const start = text.indexOf(value, from);
    if (start === -1) break;
    spans.push({ start, end: start + value.length });
    from = start + 1;
  }

  return spans;
}

function overlaps(a: Span, b: Span): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * A denominator of zero means nothing was claimed or nothing was expected, and
 * scoring that as failure would punish a detector for staying quiet on samples
 * that are not about it.
 */
function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 1 : numerator / denominator;
}

function metricsFrom(tp: number, fp: number, fn: number): Metrics {
  const precision = ratio(tp, tp + fp);
  const recall = ratio(tp, tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return { truePositives: tp, falsePositives: fp, falseNegatives: fn, precision, recall, f1 };
}

/**
 * Score one detector against the corpus.
 *
 * Detectors are measured in isolation rather than through the pipeline, so a
 * detector's numbers reflect its own behaviour and not which one happened to
 * win overlap resolution.
 */
function evaluateDetector(
  detector: Detector,
  corpus: readonly Sample[],
): { result: DetectorResult; falsePositives: FalsePositive[]; misses: Miss[] } {
  let tp = 0;
  let fp = 0;
  let fn = 0;

  const falsePositives: FalsePositive[] = [];
  const misses: Miss[] = [];

  for (const sample of corpus) {
    const expected = sample.expected.filter((e) => e.detectorId === detector.id);
    const targets = expected.map((e) => occurrences(sample.text, e.value));

    const findings: readonly Finding[] = detector.detect({
      text: sample.text,
      context: 'plain-text',
    });

    const hit = new Set<number>();
    const claimed = new Set<Finding>();

    for (const finding of findings) {
      const index = targets.findIndex((spans) =>
        spans.some((span) => overlaps(span, finding.span)),
      );
      if (index === -1) continue;

      hit.add(index);
      claimed.add(finding);
    }

    tp += hit.size;

    for (let i = 0; i < expected.length; i += 1) {
      if (hit.has(i)) continue;
      fn += 1;
      misses.push({
        detectorId: detector.id,
        sampleId: sample.id,
        value: expected[i]?.value ?? '',
      });
    }

    for (const finding of findings) {
      if (claimed.has(finding)) continue;
      fp += 1;
      falsePositives.push({
        detectorId: detector.id,
        sampleId: sample.id,
        label: finding.label,
        matched: sample.text.slice(finding.span.start, finding.span.end),
      });
    }
  }

  return {
    result: {
      detectorId: detector.id,
      description: detector.description,
      ...metricsFrom(tp, fp, fn),
    },
    falsePositives,
    misses,
  };
}

export function evaluate(detectors: readonly Detector[], corpus: readonly Sample[]): Evaluation {
  const results: DetectorResult[] = [];
  const falsePositives: FalsePositive[] = [];
  const misses: Miss[] = [];

  for (const detector of detectors) {
    const scored = evaluateDetector(detector, corpus);
    results.push(scored.result);
    falsePositives.push(...scored.falsePositives);
    misses.push(...scored.misses);
  }

  const totals = results.reduce(
    (acc, r) => ({
      tp: acc.tp + r.truePositives,
      fp: acc.fp + r.falsePositives,
      fn: acc.fn + r.falseNegatives,
    }),
    { tp: 0, fp: 0, fn: 0 },
  );

  const positiveCount = corpus.filter((s) => s.expected.length > 0).length;

  return {
    detectors: results.sort((a, b) => a.detectorId.localeCompare(b.detectorId)),
    overall: metricsFrom(totals.tp, totals.fp, totals.fn),
    sampleCount: corpus.length,
    positiveCount,
    negativeCount: corpus.length - positiveCount,
    falsePositives,
    misses,
  };
}
