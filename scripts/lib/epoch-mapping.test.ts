import test from 'node:test';
import assert from 'node:assert/strict';
import { epochModelOverride, epochScoreColumn, epochSecondaryMetrics, epochBenchmarkOverride } from './epoch-mapping.ts';

test('Aider experimental Gemini stays unmatched without changing other sources', () => {
  assert.deepEqual(epochModelOverride('Aider polyglot', 'gemini-exp-1206'), { unmatched: 'gemini-exp-1206' });
  assert.equal(epochModelOverride('Aider polyglot', 'gemini-2.0-flash-exp'), undefined);
  assert.equal(epochModelOverride('Other board', 'gemini-exp-1206'), undefined);
});

test('WeirdML Chat uses the exact Chat model without changing GPT-5 efforts', () => {
  assert.deepEqual(epochModelOverride('WeirdML', 'gpt-5-chat'), { id: 'gpt-5-chat' });
  assert.equal(epochModelOverride('WeirdML', 'gpt-5_high'), undefined);
  assert.equal(epochModelOverride('Other board', 'gpt-5-chat'), undefined);
});

test('WeirdML v3 selects Score while v2 and other benchmark columns stay unchanged', () => {
  assert.equal(epochScoreColumn('WeirdML v3', 'Max performance'), 'Score');
  assert.equal(epochScoreColumn('WeirdML', 'Accuracy'), 'Accuracy');
  assert.equal(epochScoreColumn('Other board', 'Max performance'), 'Max performance');
  assert.equal(epochScoreColumn('METR Time Horizons', 'Wrong column'), 'Time horizon');
});

test('WeirdML v3 preserves final performance as a percentage and rejects invalid units', () => {
  assert.deepEqual(epochSecondaryMetrics('WeirdML v3', { 'Max performance': '0.4352721909090909' }), { finalPerformance: 43.52721909090909 });
  assert.deepEqual(epochSecondaryMetrics('WeirdML v3', { 'Max performance': '0' }), { finalPerformance: 0 });
  assert.equal(epochSecondaryMetrics('WeirdML v3', { 'Max performance': ' ' }), null);
  assert.equal(epochSecondaryMetrics('Other board', { 'Max performance': '1' }), null);
  assert.throws(() => epochSecondaryMetrics('WeirdML v3', { 'Max performance': '43.5' }));
});

test('ProofBench remaps only explicitly identified v1.1 regrades', () => {
  assert.equal(epochBenchmarkOverride('ProofBench', 'ProofBench v1.1 re-grade: corrected formalizations. Not comparable to v1.0-era values.'), 'proofbench-1-1');
  assert.equal(epochBenchmarkOverride('ProofBench', 'ProofBench v1.1 regrade'), 'proofbench-1-1');
  assert.equal(epochBenchmarkOverride('ProofBench', 'ProofBench v1.0 original'), undefined);
  assert.equal(epochBenchmarkOverride('ProofBench', 'Plans mention v1.1'), undefined);
  assert.equal(epochBenchmarkOverride('Other board', 'ProofBench v1.1 re-grade'), undefined);
});
