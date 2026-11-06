// Tests for reading registries and hubs: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resultsModels } from './registries.ts';

test('a dataset card whose results table names current models from two labs', () => {
  // ShadowBench's card, 2026-11-05
  const card = ['| Model | Max |', '| --- | ---: |', '| Claude Opus 5.5 | 48.8 |', '| GPT-6.1 Terra | 46.4 |', '| Claude Haiku 5.5 | 41.3 |'].join('\n');
  assert.deepEqual(resultsModels(card), { models: 3, labs: 2 });
});

test('models named outside a table do not count', () => {
  assert.deepEqual(resultsModels('We generated the questions with Claude Opus 5.5 and GPT-6.1 Terra.'), { models: 0, labs: 0 });
});
