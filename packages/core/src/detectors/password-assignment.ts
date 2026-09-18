import type { Detector, Finding } from '../types';
import { isPlaceholder } from './shared/placeholders';

/**
 * Quoted values may contain anything; bare ones stop at whitespace or a
 * delimiter and must be longer, since a short unquoted value is more often a
 * variable name than a secret.
 */
/**
 * The separator may not cross a newline. With `\s*` a harmless name on one line
 * swallows the assignment on the next, and the secret below it is never seen.
 * Names may be quoted, as they are in JSON and in Python dicts.
 */
const ASSIGNMENT =
  /["']?\b([A-Za-z_][A-Za-z0-9_.-]{0,60})\b["']?[ \t]*[:=][ \t]*(?:"([^"\n]{4,})"|'([^'\n]{4,})'|([^\s"'\n,;{}()]{8,}))/g;

/**
 * Matched anywhere inside the name rather than against the whole of it, so
 * `DB_PASSWORD` and `stripe.apiKey` are caught alongside a bare `password`.
 */
const SECRET_NAME =
  /(?:passwd|password|passphrase|pwd|secret|api[_.-]?key|apikey|access[_.-]?token|auth[_.-]?token|private[_.-]?key|credential)/i;

export const passwordAssignmentDetector: Detector = {
  id: 'password-assignment',
  name: 'Assigned secret',
  category: 'credential',
  severity: 'high',
  description: 'Secrets assigned to a password- or key-shaped name.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const match of text.matchAll(ASSIGNMENT)) {
      const start = match.index;
      const name = match[1];
      if (start === undefined || name === undefined) continue;
      if (!SECRET_NAME.test(name)) continue;

      const bare = match[4];
      const value = match[2] ?? match[3] ?? bare;
      if (value === undefined) continue;
      if (isPlaceholder(value)) continue;

      // Offset of the value within the match, so the name and quotes survive
      // redaction and the line stays readable.
      const valueStart = start + match[0].lastIndexOf(value);

      findings.push({
        detectorId: 'password-assignment',
        category: 'credential',
        severity: 'high',
        confidence: bare === undefined ? 0.9 : 0.75,
        span: { start: valueStart, end: valueStart + value.length },
        label: 'Assigned secret',
        evidence: [`Assigned to a name matching a secret: ${name}`],
        redaction: { placeholder: 'SECRET' },
      });
    }

    return findings;
  },
};
