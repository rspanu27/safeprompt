import { describe, expect, it } from 'vitest';
import { databaseUrlDetector } from './database-url';
import { redact } from '../redaction/redact';
import { resolveOverlaps } from '../resolve/overlaps';

const detect = (text: string) => databaseUrlDetector.detect({ text, context: 'plain-text' });

function componentsOf(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const finding of detect(text)) {
    out[finding.redaction.placeholder] = text.slice(finding.span.start, finding.span.end);
  }
  return out;
}

describe('databaseUrlDetector', () => {
  it('splits a connection string into its parts', () => {
    const text = 'DATABASE_URL=postgres://admin:hunter2@db.internal:5432/production';

    expect(componentsOf(text)).toEqual({
      DB_USER: 'admin',
      DB_PASSWORD: 'hunter2',
      DB_HOST: 'db.internal',
      DB_NAME: 'production',
    });
  });

  it('redacts while preserving the structure of the string', () => {
    const text = 'postgres://admin:hunter2@db.internal:5432/production';
    const { text: redacted } = redact(text, resolveOverlaps(detect(text)));

    expect(redacted).toBe('postgres://[DB_USER_1]:[DB_PASSWORD_1]@[DB_HOST_1]:5432/[DB_NAME_1]');
  });

  it('rates the password critical and the database name low', () => {
    const findings = detect('mysql://root:s3cr3t@10.0.0.5/app');
    const password = findings.find((f) => f.redaction.placeholder === 'DB_PASSWORD');
    const name = findings.find((f) => f.redaction.placeholder === 'DB_NAME');

    expect(password?.severity).toBe('critical');
    expect(name?.severity).toBe('low');
  });

  it('handles a string with no credentials', () => {
    expect(componentsOf('mongodb://cluster.internal:27017/orders')).toEqual({
      DB_HOST: 'cluster.internal',
      DB_NAME: 'orders',
    });
  });

  it('handles mongodb+srv and a missing port', () => {
    expect(componentsOf('mongodb+srv://user:pw@cluster0.abcd.mongodb.net/test')).toMatchObject({
      DB_USER: 'user',
      DB_PASSWORD: 'pw',
      DB_HOST: 'cluster0.abcd.mongodb.net',
    });
  });

  it('keeps a password containing a colon intact', () => {
    expect(componentsOf('postgres://u:pa:ss@host/db')).toMatchObject({ DB_PASSWORD: 'pa:ss' });
  });

  it('ignores an uncredentialed localhost string', () => {
    expect(detect('redis://localhost:6379/0')).toHaveLength(0);
    expect(detect('postgres://127.0.0.1:5432/dev')).toHaveLength(0);
  });

  it('still flags localhost when a password is attached', () => {
    expect(componentsOf('postgres://admin:hunter2@localhost:5432/dev')).toMatchObject({
      DB_PASSWORD: 'hunter2',
    });
  });

  it('ignores an http URL', () => {
    expect(detect('https://example.com/postgres')).toHaveLength(0);
  });
});
