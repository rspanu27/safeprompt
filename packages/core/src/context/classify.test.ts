import { describe, expect, it } from 'vitest';
import { classifyContext } from './classify';

describe('classifyContext', () => {
  it('recognises JSON by parsing it', () => {
    expect(classifyContext('{"access_token": "abc", "expires_in": 3600}')).toBe('json');
    expect(classifyContext('[1, 2, 3]')).toBe('json');
  });

  it('does not call malformed JSON json', () => {
    expect(classifyContext('{"access_token": "abc",')).not.toBe('json');
  });

  it('recognises an env file', () => {
    const env = [
      'DATABASE_URL=postgres://u:p@h/db',
      'REDIS_URL=redis://cache/1',
      'export API_KEY=abc123',
    ].join('\n');

    expect(classifyContext(env)).toBe('env-file');
  });

  it('recognises a Python traceback', () => {
    const trace = [
      'Traceback (most recent call last):',
      '  File "app/db.py", line 42, in connect',
      '    raise OperationalError()',
    ].join('\n');

    expect(classifyContext(trace)).toBe('stack-trace');
  });

  it('recognises a JavaScript stack trace', () => {
    const trace = [
      'TypeError: Cannot read properties of undefined',
      '    at renderRows (app/table.tsx:118:22)',
      '    at renderWithHooks (react-dom.js:16305:18)',
    ].join('\n');

    expect(classifyContext(trace)).toBe('stack-trace');
  });

  it('recognises SQL', () => {
    const sql = ['CREATE TABLE users (', '  id BIGSERIAL PRIMARY KEY', ');'].join('\n');
    expect(classifyContext(sql)).toBe('sql');
  });

  it('recognises an application log', () => {
    const log = [
      '2026-03-02T11:04:19Z ERROR upstream returned 503',
      '2026-03-02T11:04:19Z INFO  retrying',
      '2026-03-02T11:04:20Z WARN  notifying oncall',
    ].join('\n');

    expect(classifyContext(log)).toBe('log');
  });

  it('recognises source code', () => {
    const code = [
      'export function connect(url: string) {',
      '  const client = new Client({ url });',
      '  return client.connect();',
      '}',
    ].join('\n');

    expect(classifyContext(code)).toBe('source-code');
  });

  it('prefers stack trace over source code when both apply', () => {
    const trace = [
      'Exception in thread "main" java.lang.NullPointerException',
      '    at com.acme.Service.run(Service.java:41)',
      '    at com.acme.Main.main(Main.java:12)',
    ].join('\n');

    expect(classifyContext(trace)).toBe('stack-trace');
  });

  it('falls back to plain text for prose', () => {
    expect(classifyContext('The deploy failed twice this morning and nobody knows why.')).toBe(
      'plain-text',
    );
  });

  it('treats empty input as plain text', () => {
    expect(classifyContext('   \n  ')).toBe('plain-text');
  });
});
