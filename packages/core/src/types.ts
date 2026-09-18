/** How damaging the finding would be if the content were sent. */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/** Broad grouping, used for settings toggles and UI sections. */
export type Category = 'secret' | 'credential' | 'pii' | 'infrastructure' | 'diagnostic';

/** What the pasted text appears to be. Influences severity. */
export type ContentContext =
  'source-code' | 'env-file' | 'stack-trace' | 'json' | 'sql' | 'log' | 'plain-text';

/** Half-open character range `[start, end)`, so `a.end === b.start` means touching. */
export interface Span {
  readonly start: number;
  readonly end: number;
}

/**
 * Names a placeholder family, not a final token — the redactor allocates the
 * number so equal values share a token within one scan.
 */
export interface RedactionPlan {
  readonly placeholder: string;
}

/**
 * One piece of sensitive content located in the input.
 *
 * Holds no matched text: callers slice it out of the input via `span`. That
 * keeps findings safe to count, log, and persist as scan history.
 */
export interface Finding {
  readonly detectorId: string;
  readonly category: Category;
  /** Base severity, before context adjustment. */
  readonly severity: Severity;
  /** 0..1. */
  readonly confidence: number;
  readonly span: Span;
  /** Short name, e.g. "Email address". Never the matched value. */
  readonly label: string;
  /** Why this fired, in plain English. */
  readonly evidence: readonly string[];
  readonly redaction: RedactionPlan;
}

export interface DetectorInput {
  readonly text: string;
  readonly context: ContentContext;
}

/** An independent detection rule. Pure: same input, same findings. */
export interface Detector {
  readonly id: string;
  /** Display name for grouping findings and listing detectors in settings. */
  readonly name: string;
  readonly category: Category;
  readonly severity: Severity;
  /** One line, shown in settings. */
  readonly description: string;
  detect(input: DetectorInput): readonly Finding[];
}

export interface RiskContribution {
  readonly detectorId: string;
  readonly label: string;
  readonly severity: Severity;
  readonly count: number;
  readonly points: number;
}

export interface RiskAssessment {
  /** 0..100. */
  readonly score: number;
  readonly level: Severity;
  /** Ordered by contribution, so the UI can explain the level without recomputing. */
  readonly breakdown: readonly RiskContribution[];
}

export interface ScanResult {
  readonly context: ContentContext;
  /** Ordered by position in the input. */
  readonly findings: readonly Finding[];
  readonly risk: RiskAssessment;
  readonly redacted: string;
  /** Token to original value. In memory for one scan only; never persisted. */
  readonly placeholders: ReadonlyMap<string, string>;
}

export interface ScanOptions {
  /** Defaults to the full registry. A test and settings seam. */
  readonly detectors?: readonly Detector[];
  /** Categories to report. Defaults to all of them. */
  readonly categories?: readonly Category[];
  /** Values the user has marked as fine. `*` matches any run of characters. */
  readonly allowlist?: readonly string[];
}
