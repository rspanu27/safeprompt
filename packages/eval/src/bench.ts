import { performance } from 'node:perf_hooks';
import { scanText } from '@safeprompt/core';
import { CORPUS } from './corpus';

export interface BenchCase {
  readonly name: string;
  readonly input: string;
  /** Median scan time the case must stay under, in milliseconds. */
  readonly budgetMs: number;
}

export interface BenchResult {
  readonly name: string;
  readonly bytes: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly budgetMs: number;
  readonly withinBudget: boolean;
}

/** Realistic text of roughly `bytes` length, drawn from the evaluation corpus. */
function realistic(bytes: number): string {
  const pieces: string[] = [];
  let length = 0;
  for (let i = 0; length < bytes; i += 1) {
    const sample = CORPUS[i % CORPUS.length];
    if (sample === undefined) break;
    pieces.push(sample.text);
    length += sample.text.length + 2;
  }
  return pieces.join('\n\n').slice(0, bytes);
}

/**
 * Input chosen to make regular expressions backtrack.
 *
 * Nobody pastes these on purpose, but a long base64 blob, a minified bundle or
 * a hex dump comes close, and a pattern that goes quadratic on them freezes the
 * page the user is typing into.
 */
export const ADVERSARIAL: readonly { name: string; input: string }[] = [
  { name: 'long word run, no @', input: 'a'.repeat(100_000) },
  { name: 'long run of dots and letters', input: 'a.'.repeat(50_000) },
  { name: 'email-shaped, never terminated', input: `${'a'.repeat(50_000)}@${'b'.repeat(50_000)}` },
  { name: 'JWT prefix, no dots', input: `eyJ${'A'.repeat(100_000)}` },
  {
    name: 'unterminated PEM block',
    input: `-----BEGIN RSA PRIVATE KEY-----\n${'A'.repeat(100_000)}`,
  },
  { name: 'many assignments', input: 'key=value '.repeat(10_000) },
  { name: 'dotted digits', input: '1.2.3.'.repeat(20_000) },
];

/**
 * Budgets are on the median, which a noisy shared CI runner moves far less
 * than the tail, and sit several times above what a laptop measures, so a
 * failure means a real regression rather than a slow machine. The 10 KB figure
 * is the one that matters: a typical paste has to feel instant.
 */
export function benchCases(): BenchCase[] {
  return [
    { name: 'realistic 1 KB', input: realistic(1_024), budgetMs: 5 },
    { name: 'realistic 10 KB', input: realistic(10_240), budgetMs: 10 },
    { name: 'realistic 100 KB', input: realistic(102_400), budgetMs: 100 },
    { name: 'realistic 1 MB', input: realistic(1_048_576), budgetMs: 1_000 },
    ...ADVERSARIAL.map((c) => ({ ...c, name: `adversarial: ${c.name}`, budgetMs: 250 })),
  ];
}

function percentile(sorted: readonly number[], p: number): number {
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

/** Warm up first so the numbers measure scanning, not the JIT compiling it. */
export function measure(input: string, runs: number): { medianMs: number; p95Ms: number } {
  for (let i = 0; i < 3; i += 1) scanText(input);

  const times: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    scanText(input);
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  return { medianMs: percentile(times, 50), p95Ms: percentile(times, 95) };
}

export function runBench(cases: readonly BenchCase[], runs = 15): BenchResult[] {
  return cases.map((c) => {
    const { medianMs, p95Ms } = measure(c.input, runs);
    return {
      name: c.name,
      bytes: c.input.length,
      medianMs,
      p95Ms,
      budgetMs: c.budgetMs,
      withinBudget: medianMs <= c.budgetMs,
    };
  });
}
