import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DETECTORS } from '@safeprompt/core';
import { baselineFrom, regressions, type Baseline } from './baseline';
import { classifyCorpus } from './classification';
import { CORPUS, EXPECTED_CONTEXTS } from './corpus';
import { evaluate } from './metrics';
import { renderConsole, renderMarkdown } from './report';

const BASELINE_PATH = fileURLToPath(new URL('../baseline.json', import.meta.url));
const REPORT_PATH = fileURLToPath(new URL('../../../docs/EVALUATION.md', import.meta.url));

function main(): number {
  const update = process.argv.includes('--update-baseline');

  const evaluation = evaluate(DETECTORS, CORPUS);
  const classification = classifyCorpus(CORPUS, EXPECTED_CONTEXTS);

  writeFileSync(REPORT_PATH, `${renderMarkdown(evaluation, classification)}\n`, 'utf8');
  console.log(renderConsole(evaluation, classification));
  console.log(`\nwrote ${REPORT_PATH}`);

  // An unlabelled sample is silently excluded from accuracy, which would let
  // the number drift up as the corpus grows.
  if (classification.unlabelled.length > 0) {
    console.error('\nSamples missing a context label:');
    for (const id of classification.unlabelled) console.error(`  - ${id}`);
    return 1;
  }

  if (update) {
    const baseline = baselineFrom(evaluation, classification);
    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
    console.log(`wrote ${BASELINE_PATH}`);
    return 0;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Baseline;
  const failures = regressions(evaluation, classification, baseline);

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
