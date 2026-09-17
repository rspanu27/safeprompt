import type { ClassificationResult } from './classification';
import type { Evaluation } from './metrics';

export interface Baseline {
  readonly overall: { readonly precision: number; readonly recall: number };
  readonly detectors: Readonly<
    Record<string, { readonly precision: number; readonly recall: number }>
  >;
  readonly classificationAccuracy: number;
}

/** Room for rounding and for a corpus entry that shifts a ratio slightly. */
const TOLERANCE = 0.01;

const floor = (value: number): number => Math.max(0, Math.round((value - TOLERANCE) * 1000) / 1000);

export function baselineFrom(
  evaluation: Evaluation,
  classification: ClassificationResult,
): Baseline {
  const detectors: Record<string, { precision: number; recall: number }> = {};

  for (const d of evaluation.detectors) {
    detectors[d.detectorId] = { precision: floor(d.precision), recall: floor(d.recall) };
  }

  return {
    overall: {
      precision: floor(evaluation.overall.precision),
      recall: floor(evaluation.overall.recall),
    },
    detectors,
    classificationAccuracy: floor(classification.accuracy),
  };
}

/** Human-readable reasons the run fell below the committed baseline. */
export function regressions(
  evaluation: Evaluation,
  classification: ClassificationResult,
  baseline: Baseline,
): string[] {
  const failures: string[] = [];

  const compare = (name: string, actual: number, expected: number, metric: string): void => {
    if (actual + 1e-9 < expected) {
      failures.push(
        `${name} ${metric} dropped to ${(actual * 100).toFixed(1)}% (baseline ${(expected * 100).toFixed(1)}%)`,
      );
    }
  };

  compare('overall', evaluation.overall.precision, baseline.overall.precision, 'precision');
  compare('overall', evaluation.overall.recall, baseline.overall.recall, 'recall');

  for (const d of evaluation.detectors) {
    const expected = baseline.detectors[d.detectorId];
    if (expected === undefined) continue;

    compare(d.detectorId, d.precision, expected.precision, 'precision');
    compare(d.detectorId, d.recall, expected.recall, 'recall');
  }

  compare('context', classification.accuracy, baseline.classificationAccuracy, 'accuracy');

  return failures;
}
