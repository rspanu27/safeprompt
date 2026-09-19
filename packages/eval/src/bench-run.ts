import { benchCases, runBench } from './bench';

const fmt = (ms: number): string => `${ms.toFixed(2)} ms`.padStart(11);

function main(): number {
  const results = runBench(benchCases());
  const width = Math.max(...results.map((r) => r.name.length));

  console.log(
    `${'case'.padEnd(width)}  ${'size'.padStart(9)}  ${'median'.padStart(11)}  ${'p95'.padStart(11)}  budget`,
  );

  for (const r of results) {
    const size = `${(r.bytes / 1024).toFixed(0)} KB`.padStart(9);
    const mark = r.withinBudget ? 'ok' : 'OVER';
    console.log(
      `${r.name.padEnd(width)}  ${size}  ${fmt(r.medianMs)}  ${fmt(r.p95Ms)}  ${r.budgetMs} ms  ${mark}`,
    );
  }

  const over = results.filter((r) => !r.withinBudget);
  if (over.length > 0) {
    console.error(`\n${over.length} case(s) over budget.`);
    return 1;
  }

  console.log('\nAll cases within budget.');
  return 0;
}

process.exitCode = main();
