import { describe, expect, it } from 'vitest';
import { isPlaceholder } from './placeholders';

describe('isPlaceholder', () => {
  it.each([
    'changeme',
    'CHANGEME',
    'your-api-key',
    'YOUR_SECRET_HERE',
    '<your-token>',
    '{{api_key}}',
    '${DB_PASSWORD}',
    '%API_KEY%',
    'process.env.SECRET',
    'os.getenv("TOKEN")',
    'xxxxxxxxxxxx',
    'aaaaaaaa',
    '00000000',
    'AKIAIOSFODNN7EXAMPLE',
    'not-a-real-key-sample',
    '   ',
  ])('treats %s as a placeholder', (value) => {
    expect(isPlaceholder(value)).toBe(true);
  });

  it.each([
    'Tr0ub4dor&3',
    'AKIA2E0RZXQ7MLPKWV3B',
    'hunter2',
    'sk_live_9f8e7d6c5b4a3210',
    'p@ssw0rd!2024',
  ])('treats %s as a real value', (value) => {
    expect(isPlaceholder(value)).toBe(false);
  });
});
