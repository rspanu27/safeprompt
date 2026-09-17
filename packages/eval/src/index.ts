export { CORPUS, EXPECTED_CONTEXTS, NEGATIVES, POSITIVES } from './corpus';
export type { Expectation, Sample } from './corpus';
export { classifyCorpus } from './classification';
export type { ClassificationResult, Misclassification } from './classification';
export { evaluate } from './metrics';
export type { DetectorResult, Evaluation, FalsePositive, Metrics, Miss } from './metrics';
export { renderConsole, renderMarkdown } from './report';
export { baselineFrom, regressions } from './baseline';
export type { Baseline } from './baseline';
