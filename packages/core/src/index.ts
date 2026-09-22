/**
 * Public API. An ESLint rule blocks deep imports past this file, so everything
 * below it can be reorganised freely.
 */

export { scanText } from './pipeline';
export { DETECTORS } from './detectors';
export { classifyContext } from './context/classify';
export { rehydrate } from './redaction/redact';
export { splitRedacted, type RedactedSegment } from './redaction/segments';
export { allowlistPatternProblem } from './allowlist';
export { SEVERITY_RANK, severityAtLeast } from './severity';

export type {
  Category,
  ContentContext,
  Detector,
  DetectorInput,
  Finding,
  RedactionPlan,
  RiskAssessment,
  RiskContribution,
  ScanOptions,
  ScanResult,
  Severity,
  Span,
} from './types';
