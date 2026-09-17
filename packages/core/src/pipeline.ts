import { classifyContext } from './context/classify';
import { DETECTORS } from './detectors';
import { redact } from './redaction/redact';
import { assessRisk } from './scoring/risk';
import type { Finding, ScanOptions, ScanResult } from './types';

/** By position, longest first on ties — makes overlap handling deterministic. */
function byPosition(a: Finding, b: Finding): number {
  return a.span.start - b.span.start || b.span.end - a.span.end;
}

/**
 * Scan text for sensitive content.
 *
 * The extension's only entry point. Synchronous and free of environment
 * access, so it runs unchanged in a content script, a test, or a CLI.
 */
export function scanText(input: string, options: ScanOptions = {}): ScanResult {
  const detectors = options.detectors ?? DETECTORS;
  const context = classifyContext(input);

  const findings = detectors
    .flatMap((detector) => detector.detect({ text: input, context }))
    .sort(byPosition);

  const risk = assessRisk(findings);
  const { text, placeholders } = redact(input, findings);

  return { context, findings, risk, redacted: text, placeholders };
}
