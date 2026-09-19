import type { Detector, Finding } from '../types';

/**
 * Suffixes reserved for private networks. These reveal internal infrastructure
 * even when no password comes with them.
 *
 * `\b` alone doesn't anchor this well enough, because every `.` is a word
 * boundary. On `a.a.a.a…` a match was tried at every label and each attempt
 * scanned the rest of the text, which is quadratic. The lookbehind only allows
 * a match to start at the beginning of the hostname.
 */
const INTERNAL_SUFFIX =
  /(?<![a-z0-9.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(internal|intranet|corp|lan|localdomain|local)\b/gi;

/**
 * `svc.cluster.local` is the Kubernetes in-cluster form. Anchored like the one
 * above, so the labels before `svc` are open-ended rather than fixed at two.
 */
const CLUSTER_SUFFIX = /(?<![a-z0-9.-])(?:[a-z0-9-]+\.){2,}svc(?:\.cluster\.local)?\b/gi;

export const internalHostnameDetector: Detector = {
  id: 'internal-hostname',
  name: 'Internal hostname',
  category: 'infrastructure',
  severity: 'medium',
  description: 'Hostnames on reserved internal domains.',

  detect({ text }) {
    const findings: Finding[] = [];

    const push = (start: number, value: string, evidence: string): void => {
      findings.push({
        detectorId: 'internal-hostname',
        category: 'infrastructure',
        severity: 'medium',
        confidence: 0.8,
        span: { start, end: start + value.length },
        label: 'Internal hostname',
        evidence: [evidence],
        redaction: { placeholder: 'HOST' },
      });
    };

    for (const match of text.matchAll(INTERNAL_SUFFIX)) {
      const value = match[0];
      const start = match.index;
      const suffix = match[1];
      if (value === undefined || start === undefined) continue;

      push(start, value, `Reserved internal suffix .${suffix?.toLowerCase() ?? 'internal'}`);
    }

    for (const match of text.matchAll(CLUSTER_SUFFIX)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      push(start, value, 'Kubernetes in-cluster service address');
    }

    return findings;
  },
};
