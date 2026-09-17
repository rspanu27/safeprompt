/**
 * Public API. An ESLint rule blocks deep imports past this file, so everything
 * below it can be reorganised freely.
 */

export { scanText } from './pipeline';
export { DETECTORS } from './detectors';
export { rehydrate } from './redaction/redact';

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
