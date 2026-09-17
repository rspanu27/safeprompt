import { NEGATIVES } from './negatives';
import { POSITIVES } from './positives';
import type { Sample } from './types';

export const CORPUS: readonly Sample[] = [...POSITIVES, ...NEGATIVES];

export { NEGATIVES, POSITIVES };
export type { Expectation, Sample } from './types';
