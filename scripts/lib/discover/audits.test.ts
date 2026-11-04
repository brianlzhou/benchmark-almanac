// Tests for audit detection: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditSignal, benchmarksIn } from './audits.ts';

test('known audits read as audits', () => {
  const mmlu = auditSignal(
    'Are We Done with MMLU?',
    'Maybe not. We identify and analyse errors in the popular Massive Multitask Language Understanding (MMLU) benchmark. For example, we find that 57% of the analysed questions in the Virology subset contain errors. We introduce MMLU-Redux, a subset of 5,700 manually re-annotated questions.',
  );
  assert.ok(mmlu.score >= 4);
  assert.ok(mmlu.problems.includes('wrong-labels'));
  const gsm = auditSignal(
    'A Careful Examination of Large Language Model Performance on Grade School Arithmetic',
    'There is growing concern that some of this performance actually reflects dataset contamination. We commission Grade School Math 1000 (GSM1k) to mirror GSM8k and find accuracy drops of up to 8%.',
  );
  assert.ok(gsm.score >= 4);
  assert.ok(gsm.problems.includes('contamination'));
});

test('model audits, rumors and benchmark launches do not', () => {
  assert.ok(auditSignal('A Protocol for Auditing Demographic Bias in System One Decision Models', 'We swap names in prompts from BBQ and CrowS-Pairs.').score < 4);
  assert.ok(auditSignal('DeepSeek-Cyber (unconfirmed)', 'Leaked scores circulated, including about 92% on CyberGym.').score < 4);
  assert.ok(auditSignal('FooBench: a new benchmark', 'We introduce FooBench. Existing benchmarks such as MMLU suffer from contamination.').score < 4);
});

test('the longest cataloged name wins, and names without a benchmark word count', () => {
  assert.deepEqual(benchmarksIn("Xeophon's audit found AutomationBench forcing prose request bodies, and OfficeQA Pro v2's grader rejects valid answers.").sort(), ['automationbench', 'officeqa-pro-v2']);
  assert.ok(benchmarksIn('errors in the MMLU benchmark and in MMLU-Redux').includes('mmlu'));
});
