// Tests for the model discovery helpers: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modelMentions, modelNames, isRepack, derivedFrom, otherFamily, modelKey, modelScore, launchedModel, postsOf, type ModelFind } from './models.ts';

test("a lab's launch post names its model", () => {
  const lead = 'Today we are introducing our second model generation with Inkling 2 Small. It is a Mixture-of-Experts model with 594B total parameters.';
  assert.equal(launchedModel('Introducing Inkling 2 Small', lead), 'Inkling 2 Small');
  assert.equal(launchedModel('Inkling: Our Open-Weights Model', 'Inkling is our first open-weights model.'), 'Inkling');
  assert.equal(launchedModel('Introducing SWE-2 Flash | Cognition', 'SWE-2 Flash is a coding model.'), 'SWE-2 Flash');
  // a product or a research post is not a model launch
  assert.equal(launchedModel('One Year of Tinker: Turning Your Expertise into Custom Models', 'Tinker turned one this month.'), undefined);
  assert.equal(launchedModel('Announcing Safety Research Grants', 'We fund research on model safety.'), undefined);
});

test('a news index page gives each post with its title and date', () => {
  const html =
    '<ol><li><a class="post-item-link" href="/news/inkling-2-small/"><div><h2 class="post-title">Introducing Inkling 2 Small</h2></div><time datetime="2026-11-05">Nov 5, 2026</time></a></li>' +
    '<li><a href="/join/">Join us</a></li></ol>';
  assert.deepEqual(postsOf({ lab: 'Thinking Machines', list: 'https://thinkingmachines.ai/news/', kind: 'index', path: /^\/news\/[\w-]+\/$/ }, html), [
    { url: 'https://thinkingmachines.ai/news/inkling-2-small/', title: 'Introducing Inkling 2 Small', date: '2026-11-05' },
  ]);
});

test('a launch sentence gives the model name and its maker', () => {
  assert.deepEqual(modelMentions('Google DeepMind introduced Genie 4, its most realistic world model yet.'), [{ name: 'Genie 4', org: 'Google DeepMind' }]);
  assert.deepEqual(modelMentions("Reflection's Beam 1.0 has 500B total parameters, released today as open weights."), [{ name: 'Beam 1.0', org: 'Reflection' }]);
  assert.deepEqual(modelNames('Today we are releasing Ripple-65B Preview, an open-weight model.'), ['Ripple-65B Preview']);
  assert.deepEqual(modelNames('Cognition launched SWE-2 Flash, a coding model at one-fifth the price.'), ['SWE-2 Flash']);
});

test('rumors, labels, copies and benchmarks are not models', () => {
  assert.deepEqual(modelNames('Upcoming model rumors (unconfirmed): GPT-6.2 Astra is reportedly launching soon.'), []);
  assert.deepEqual(modelNames('They released BF16, FP8 and GPTQ-Int4 weights under Apache-2.0, a 1T-total A52B model.'), []);
  assert.deepEqual(modelNames('The team released Heretic 2.0 weights for the model.'), []);
  assert.deepEqual(modelNames('The lab released SWE-Bench Pro v2 to test models.'), []);
  // no launch wording, or no model word
  assert.deepEqual(modelNames('Kimi K3.1 Pro tops the chart.'), []);
});

test('repackaged copies and other accounts’ fine-tunes are skipped', () => {
  assert.ok(isRepack('unsloth/DeepSeek-V4.1-Flash-1017-GGUF'));
  assert.ok(isRepack('OBLITERATUS/DeepSeek-V4.1-Flash-1017-obliterated'));
  assert.ok(isRepack('ricursiveAI/Ripple-65B-Preview-NVFP4'));
  assert.ok(!isRepack('ricursiveAI/Ripple-65B-Preview'));
  assert.equal(derivedFrom(['base_model:finetune:Qwen/Qwen3.8-27B'], 'summerAIO'), 'Qwen/Qwen3.8-27B');
  assert.equal(derivedFrom(['base_model:finetune:Qwen/Qwen3.8-27B-Base'], 'Qwen'), undefined);
  assert.ok(otherFamily('Qwen3.8-27B-Longbook27-v2', 'summerAIO'));
  assert.ok(!otherFamily('Qwen3.8-Flash-Next', 'Qwen'));
});

test('repo and prose spellings share a key', () => {
  assert.equal(modelKey('ricursiveAI/Ripple-65B-Preview'), modelKey('Ripple-65B Preview'));
});

test('a lab release with a second source outranks a trending repo', () => {
  const f = (o: Partial<ModelFind>): ModelFind => ({ key: 'k', name: 'n', url: '', first: '', last: '', sources: [], score: 0, ...o });
  const lab = f({ lab: 'qwen', params: 180, likes: 6781, sources: [{ source: 'Hugging Face (Qwen)', kind: 'hf-lab', url: '' }, { source: 'Leaderboards (5)', kind: 'boards', url: '' }] });
  const trending = f({ params: 35, sources: [{ source: 'Hugging Face trending (#143)', kind: 'hf-trending', url: '' }] });
  assert.equal(modelScore(lab), 13);
  assert.equal(modelScore(trending), 3);
});
