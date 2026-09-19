import type { Detector, Finding, Severity } from '../types';
import { isPlaceholder } from './shared/placeholders';

const SCHEMES = [
  'postgres',
  'postgresql',
  'mysql',
  'mariadb',
  'mongodb\\+srv',
  'mongodb',
  'redis',
  'rediss',
  'amqps',
  'amqp',
  'mssql',
  'sqlserver',
  'clickhouse',
];

/** The lookbehind stops `https://host/v1/postgres://x` matching inside a path. */
const CANDIDATE = new RegExp(`(?<![\\w/.-])(?:${SCHEMES.join('|')})://[^\\s"'\`<>]+`, 'gi');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

interface Component {
  readonly value: string;
  readonly start: number;
  readonly label: string;
  readonly placeholder: string;
  readonly severity: Severity;
}

/**
 * Split a connection string into its parts.
 *
 * Parsed by hand because `URL` is only in the DOM type definitions, which this
 * package is compiled without. Parsing it here also gives the character offsets
 * of each part directly, which redaction needs.
 */
function parse(url: string, offset: number): { components: Component[]; host: string } | null {
  const schemeEnd = url.indexOf('://');
  if (schemeEnd === -1) return null;

  const authorityStart = schemeEnd + 3;
  const pathIndex = url.slice(authorityStart).search(/[/?]/);
  const authorityEnd = pathIndex === -1 ? url.length : authorityStart + pathIndex;

  const authority = url.slice(authorityStart, authorityEnd);
  const at = authority.lastIndexOf('@');

  const components: Component[] = [];

  let hostStart = authorityStart;
  let hostPort = authority;

  if (at !== -1) {
    const userInfo = authority.slice(0, at);
    hostStart = authorityStart + at + 1;
    hostPort = authority.slice(at + 1);

    const colon = userInfo.indexOf(':');
    const user = colon === -1 ? userInfo : userInfo.slice(0, colon);
    const password = colon === -1 ? '' : userInfo.slice(colon + 1);

    if (user.length > 0) {
      components.push({
        value: user,
        start: offset + authorityStart,
        label: 'Database username',
        placeholder: 'DB_USER',
        severity: 'medium',
      });
    }

    if (password.length > 0) {
      components.push({
        value: password,
        start: offset + authorityStart + colon + 1,
        label: 'Database password',
        placeholder: 'DB_PASSWORD',
        severity: 'critical',
      });
    }
  }

  // Port stays visible: it carries no secret and keeps the output readable.
  const portColon = hostPort.lastIndexOf(':');
  const hasPort = portColon !== -1 && /^\d+$/.test(hostPort.slice(portColon + 1));
  const host = hasPort ? hostPort.slice(0, portColon) : hostPort;

  if (host.length > 0) {
    components.push({
      value: host,
      start: offset + hostStart,
      label: 'Database host',
      placeholder: 'DB_HOST',
      severity: 'medium',
    });
  }

  const path = url.slice(authorityEnd);
  const database = /^\/([^/?#]+)/.exec(path);
  // A bare number is a Redis database index, not a name worth hiding.
  if (database?.[1] !== undefined && !/^\d+$/.test(database[1])) {
    components.push({
      value: database[1],
      start: offset + authorityEnd + 1,
      label: 'Database name',
      placeholder: 'DB_NAME',
      severity: 'low',
    });
  }

  return { components, host };
}

export const databaseUrlDetector: Detector = {
  id: 'database-url',
  name: 'Database connection string',
  category: 'credential',
  severity: 'critical',
  description: 'Database connection strings, redacted component by component.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const match of text.matchAll(CANDIDATE)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      const parsed = parse(value, start);
      if (parsed === null) continue;

      const components = parsed.components.filter((c) => !isPlaceholder(c.value));
      const hasCredentials = components.some((c) => c.placeholder === 'DB_PASSWORD');

      // `postgres://user:password@localhost/mydb` is in every README. Without a
      // real credential, a local host makes the whole string uninteresting.
      if (!hasCredentials && LOCAL_HOSTS.has(parsed.host.toLowerCase())) continue;

      for (const component of components) {
        findings.push({
          detectorId: 'database-url',
          category: 'credential',
          severity: component.severity,
          confidence: 0.95,
          span: { start: component.start, end: component.start + component.value.length },
          label: component.label,
          evidence: ['Component of a database connection string'],
          redaction: { placeholder: component.placeholder },
        });
      }
    }

    return findings;
  },
};
