// Tests for telling new benchmarks from cataloged ones: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { knownFind } from './core.ts';

test('a cataloged benchmark with no paper link meets a paper with its name as known', () => {
  // GDPx is cataloged from SemiAnalysis's post and site, with no paper. The paper then waits on the New page,
  // where a person checks whether it is GDPx's own paper or a different test with the same name.
  assert.equal(knownFind({ name: 'GDPx', introduced: true, arxiv: '2611.99999' }), 'gdpx');
});

test('a paper that introduces a test under a cataloged name, when the record has another paper, stays separate', () => {
  // the Collaborative Intelligence Benchmark's paper is arXiv 2611.02633
  assert.equal(knownFind({ name: 'Collaborative Intelligence Benchmark', introduced: true, arxiv: '2601.00001' }), undefined);
  assert.equal(knownFind({ name: 'Collaborative Intelligence Benchmark', introduced: true, arxiv: '2611.02633' }), 'collaborative-intelligence-benchmark');
});

test('a launch of a cataloged benchmark under a variant of its maker\'s name, or linking its site, is known', () => {
  // Grok called DeepFinance's maker "Julius AI"; the record says Julius Research (2026-11-06)
  assert.equal(knownFind({ name: 'DeepFinance', introduced: true, org: 'Julius AI' }), 'deepfinance');
  assert.equal(knownFind({ name: 'DeepFinance', introduced: true, org: 'Someone Else', url: 'https://www.juliusresearch.ai/blog/deep-finance' }), 'deepfinance');
  assert.equal(knownFind({ name: 'DeepFinance', introduced: true, org: 'Someone Else' }), undefined);
});
