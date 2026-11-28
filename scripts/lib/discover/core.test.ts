// Tests for telling new benchmarks from cataloged ones: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { knownFind, stageA, introBench, paperName } from './core.ts';

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

test('an abstract that introduces a Bench-style name with no benchmark word after it passes Stage A', () => {
  // Hugging Face Daily Papers of 2026-11-24, both dropped at 4 points before this rule
  const rui =
    'To systematically study its impact, we introduce RUIBench, comprising 30 manipulation tasks across five suites spanning world knowledge, in-context learning, discovery, dynamic interaction, and contact-rich manipulation. We further develop RUIKit, a unified framework that crosses six action abstractions with two interaction forms.';
  assert.equal(introBench(rui), 'RUIBench');
  assert.ok(stageA('RUIBench: What Makes a Good Robot-Use Interface?', rui, true) >= 5);
  const hive =
    'Bimanual policies instead read dense patch tokens from cameras on the robot. We introduce HIVE-Bench: one shared flow-matching policy reads 20 encoders from seven families on 24 egocentric bimanual tasks, across adaptation, task sharing, and sweeps of data, model size, and layer.';
  assert.equal(introBench(hive), 'HIVE-Bench');
  assert.ok(stageA('HIVE-Bench: Evaluating Patch-Level Visual Representations for Egocentric Robot Manipulation', hive, true) >= 5);
  // a method paper that introduces its benchmark second is named by the benchmark (2611.22275)
  const heave = 'We introduce Heave-Ho, a decentralized framework. To benchmark these capabilities, we introduce HH-Bench, comprising 12 tasks.';
  assert.equal(paperName('Heave-Ho: Decentralized Long-Horizon Multi-Humanoid Collaboration', heave), 'HH-Bench');
});

test('an abstract that introduces a model, a training Gym, or results on a known benchmark stays under 5', () => {
  const model = 'We introduce FooNet, a model that outperforms prior methods on long-context reasoning while using half the memory. Code is available.';
  assert.equal(introBench(model), undefined);
  assert.ok(stageA('FooNet: Efficient Long-Context Reasoning', model, true) < 5);
  // 2611.23946 trains GUI agents in a pruned environment
  const gym = 'Following these findings, we build MobileGym-Lite, which keeps reward and data coverage complete and prunes unneeded features.';
  assert.equal(introBench(gym), undefined);
  assert.ok(stageA('How Complete Must an Environment Be to Train a Capable GUI Agent?', gym, false) < 5);
  assert.equal(introBench('We present SWE-bench results for twelve agents, and we develop WebArena agents that plan.'), undefined);
});
