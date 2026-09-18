import { compileAllowlist } from './allowlist';
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
  const categories = options.categories === undefined ? null : new Set(options.categories);
  const allowed = compileAllowlist(options.allowlist ?? []);
  const context = classifyContext(input);

  // Filtered before resolution, so a disabled or allowlisted finding cannot
  // suppress an overlapping one the user still wants to see.
  const matches = detectors
    .flatMap((detector) => detector.detect({ text: input, context }))
    .filter((f) => categories === null || categories.has(f.category))
    .filter((f) => !allowed(input.slice(f.span.start, f.span.end)));

  const findings = applyContext(resolveOverlaps(matches), context);

  const risk = assessRisk(findings);
  const { text, placeholders } = redact(input, findings);

  return { context, findings, risk, redacted: text, placeholders };
}
