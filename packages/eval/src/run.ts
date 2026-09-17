import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DETECTORS } from '@safeprompt/core';
import { baselineFrom, regressions, type Baseline } from './baseline';
import { CORPUS } from './corpus';
import { evaluate } from './metrics';
import { renderConsole, renderMarkdown } from './report';

const BASELINE_PATH = fileURLToPath(new URL('../baseline.json', import.meta.url));
const REPORT_PATH = fileURLToPath(new URL('../../../docs/EVALUATION.md', import.meta.url));

function main(): number {
  const update = process.argv.includes('--update-baseline');
  const evaluation = evaluate(DETECTORS, CORPUS);

  writeFileSync(REPORT_PATH, `${renderMarkdown(evaluation)}\n`, 'utf8');
  console.log(renderConsole(evaluation));
  console.log(`\nwrote ${REPORT_PATH}`);

  if (update) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baselineFrom(evaluation), null, 2)}\n`, 'utf8');
    console.log(`wrote ${BASELINE_PATH}`);
    return 0;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
  const failures = regressions(evaluation, baseline);

  if (failures.length > 0) {
    console.error('\nEvaluation regressed:');
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error('\nFix the detector, or rerun with --update-baseline if the change is intended.');
    return 1;
  }

  console.log('\nNo regression against the committed baseline.');
  return 0;
}

process.exitCode = main();
