import { classifyContext, type ContentContext } from '@safeprompt/core';
import type { Sample } from './corpus';

export interface Misclassification {
  readonly sampleId: string;
  readonly expected: ContentContext;
  readonly actual: ContentContext;
}

export interface ClassificationResult {
  readonly total: number;
  readonly correct: number;
  readonly accuracy: number;
  readonly misclassified: readonly Misclassification[];
  /** Sample ids with no entry in the expectations table. */
  readonly unlabelled: readonly string[];
}

export function classifyCorpus(
  corpus: readonly Sample[],
  expectations: Readonly<Record<string, ContentContext>>,
): ClassificationResult {
  const misclassified: Misclassification[] = [];
  const unlabelled: string[] = [];
  let correct = 0;
  let total = 0;

  for (const sample of corpus) {
    const expected = expectations[sample.id];
    if (expected === undefined) {
      unlabelled.push(sample.id);
      continue;
    }

    total += 1;
    const actual = classifyContext(sample.text);

    if (actual === expected) {
      correct += 1;
    } else {
      misclassified.push({ sampleId: sample.id, expected, actual });
    }
  }

  return {
    total,
    correct,
    accuracy: total === 0 ? 1 : correct / total,
    misclassified,
    unlabelled,
  };
}
