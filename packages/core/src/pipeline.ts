import { classifyContext } from './context/classify';
import { applyContext } from './context/severity';
import { DETECTORS } from './detectors';
import { redact } from './redaction/redact';
import { resolveOverlaps } from './resolve/overlaps';
import { assessRisk } from './scoring/risk';
import type { ScanOptions, ScanResult } from './types';

/**
 * Scan text for sensitive content.
 *
 * The extension's only entry point. Synchronous and free of environment
 * access, so it runs unchanged in a content script, a test, or a CLI.
 */
export function scanText(input: string, options: ScanOptions = {}): ScanResult {
  const detectors = options.detectors ?? DETECTORS;
  const context = classifyContext(input);

  const matches = detectors.flatMap((detector) => detector.detect({ text: input, context }));
  const findings = applyContext(resolveOverlaps(matches), context);

  const risk = assessRisk(findings);
  const { text, placeholders } = redact(input, findings);

  return { context, findings, risk, redacted: text, placeholders };
}
