import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Leaderboard } from '../../leaderboards/types.ts';
import { withKaggle } from './kaggle.ts';

// one Kaggle leaderboard row, in the public endpoint's shape
const KAGGLE = {
  rows: [
    {
      modelVersionName: 'Model B',
      taskResults: [
        { benchmarkTaskName: 'Average', result: { numericResult: { value: 0.5 }, evaluationDate: '2026-11-01T00:00:00Z' } },
        { benchmarkTaskName: 'Part One', result: { numericResult: { value: 0.25 } } },
      ],
    },
  ],
};

test('withKaggle adds Kaggle runs as a named source', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    assert.equal(url, 'https://www.kaggle.com/api/v1/benchmarks/owner/slug/leaderboard');
    return new Response(JSON.stringify(KAGGLE));
  });
  const board: Leaderboard = {
    benchmark: 'test-bench',
    url: 'https://example.org/board',
    feed: 'https://example.org/board.json',
    terms: 'Test terms.',
    parts: { one: 'Part one' },
    async fetch() {
      return [{ model: 'Model A', score: 70, metrics: { one: 60 } }];
    },
  };
  const both = withKaggle(board, { owner: 'owner', slug: 'slug', task: 'Average', scale: 100, extra: { one: { task: 'Part One', scale: 100 } }, stats: { only: { name: 'Only Kaggle', unit: '%' } } });
  assert.equal(both.url, board.url);
  assert.deepEqual(Object.keys(both.sources ?? {}), ['kaggle']);
  assert.equal(both.sources!.kaggle.url, 'https://www.kaggle.com/benchmarks/owner/slug');
  assert.deepEqual(both.parts, { one: 'Part one' });
  assert.deepEqual(Object.keys(both.stats ?? {}), ['only']);
  const rows = await both.fetch();
  assert.deepEqual(rows[0], { model: 'Model A', score: 70, metrics: { one: 60 } });
  assert.equal(rows[1].model, 'Model B');
  assert.equal(rows[1].score, 50);
  assert.equal(rows[1].metrics?.one, 25);
  assert.equal(rows[1].date, '2026-11-01');
  assert.equal(rows[1].source, 'kaggle');
});

test('withKaggle fails when Kaggle has no score on the task', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ rows: [] })));
  const board: Leaderboard = { benchmark: 'x', url: 'u', feed: 'f', terms: 't', fetch: async () => [{ model: 'A', score: 1 }] };
  await assert.rejects(withKaggle(board, { owner: 'o', slug: 's', task: 'Score', scale: 1 }).fetch(), /no rows/);
});
