import test from 'node:test';
import assert from 'node:assert/strict';
import { epochModelOverride, epochScoreColumn, epochSecondaryMetrics, epochBenchmarkOverride, epochRecord } from './epoch-mapping.ts';

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
  const notes = (Notes: string) => ({ Notes });
  assert.equal(epochBenchmarkOverride('ProofBench', notes('ProofBench v1.1 re-grade: corrected formalizations. Not comparable to v1.0-era values.')), 'proofbench-1-1');
  assert.equal(epochBenchmarkOverride('ProofBench', notes('ProofBench v1.1 regrade')), 'proofbench-1-1');
  assert.equal(epochBenchmarkOverride('ProofBench', notes('ProofBench v1.0 original')), undefined);
  assert.equal(epochBenchmarkOverride('ProofBench', notes('Plans mention v1.1')), undefined);
  assert.equal(epochBenchmarkOverride('Other board', notes('ProofBench v1.1 re-grade')), undefined);
});

test('METR rows follow Epoch\'s METR version column, and only v1.1 moves', () => {
  assert.equal(epochBenchmarkOverride('METR Time Horizons', { 'METR version': 'METR-Horizon-v1.1' }), 'metr-time-horizon-1-1');
  assert.equal(epochBenchmarkOverride('METR Time Horizons', { 'METR version': 'METR-Horizon-v1.0' }), undefined);
  assert.equal(epochBenchmarkOverride('METR Time Horizons', { 'METR version': '' }), undefined);
  assert.equal(epochBenchmarkOverride('Other board', { 'METR version': 'METR-Horizon-v1.1' }), undefined);
});

test('OSWorld 2.0 rows for models from July 2026 go to the August patch release', () => {
  assert.equal(epochBenchmarkOverride('OSWorld 2.0', { 'Release date': '2026-07-24' }), 'osworld-2-0-2026-08-08');
  assert.equal(epochBenchmarkOverride('OSWorld 2.0', { 'Release date': '2026-05-28' }), undefined);
  assert.equal(epochBenchmarkOverride('OSWorld 2.0', {}), undefined);
});

test('whole Epoch files pinned to the version they hold', () => {
  assert.equal(epochRecord('FrontierCode'), 'frontiercode-1-1');
  assert.equal(epochRecord('CursorBench'), 'cursorbench-4-1');
  assert.equal(epochRecord('PostTrainBench'), 'posttrainbench-1-2');
  assert.equal(epochRecord('GPQA diamond'), undefined);
});
