import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notModel } from './not-models.ts';

test('people, random and majority rows are not models on any board', () => {
  for (const name of ['Human', 'Humans', 'MTurk Human', 'Human Expert', 'Human Agent', 'human-baseline', 'SuperGLUE Human Baselines',
    'GLUE Human Baselines', 'Random', 'random', 'Uniform random', 'Random guess (always B)', 'Majority class', 'Chance',
    'mteb/baseline-random-encoder']) assert.equal(notModel(name), true, name);
});

test('named systems that only contain one of those words stay', () => {
  for (const name of ['Alpaca Farm PPO Human 7B', 'TrustLLMeu/baseline-7-8b_1t-tokens_llama', 'Random Forest', 'mteb/baseline-bm25s',
    'Chance Vision 1.5', 'Three Experts', 'Human bias', 'expert', 'The Oracle', 'OS-Oracle-7B', 'SuperGrok Expert',
    'ai-human-lab/EEVE-Korean-10.8B-RAFT', 'Human-centred AI (HAI) research group']) assert.equal(notModel(name), false, name);
});

test('a board names its own reference rows', () => {
  assert.equal(notModel('Momentum (Baseline)', /\(Baseline\)$/), true);
  assert.equal(notModel('GPT-6 Astra', /\(Baseline\)$/), false);
});
