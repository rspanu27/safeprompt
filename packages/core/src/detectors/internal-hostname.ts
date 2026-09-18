import type { Detector, Finding } from '../types';

/**
 * Suffixes reserved for private networks. Leaking these maps out internal
 * infrastructure even when no credential is attached.
 */
const INTERNAL_SUFFIX =
  /\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(internal|intranet|corp|lan|localdomain|local)\b/gi;

/** `svc.cluster.local` is the Kubernetes in-cluster form. */
const CLUSTER_SUFFIX = /\b[a-z0-9-]+\.[a-z0-9-]+\.svc(?:\.cluster\.local)?\b/gi;

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
