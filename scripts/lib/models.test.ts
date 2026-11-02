// Tests for the model-name matcher: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeResolver } from './models.ts';

const resolve = makeResolver();

test('a date stamp picks that snapshot, not the newest', () => {
  assert.equal(resolve('gpt-4o-2024-05-13')?.id, 'gpt-4o-may-2024');
  assert.equal(resolve('gpt-4o-2024-08-06')?.id, 'gpt-4o-aug-2024');
  assert.equal(resolve('gpt-4o-2024-11-20')?.id, 'gpt-4o-nov-2024');
});

test('a vendor prefix and a trailing date are dropped', () => {
  assert.equal(resolve('anthropic/claude-opus-4-20250514')?.id, 'claude-opus-4');
});

test('an effort in parentheses becomes the setting', () => {
  assert.deepEqual(resolve('Claude Opus 5.5 (max)'), { id: 'claude-opus-5-5', setting: 'max' });
  assert.equal(resolve('Grok 4 Fast (High reasoning)')?.setting, 'high');
});

test('"non-reasoning" and "no reasoning" keep the whole label', () => {
  assert.equal(resolve('Grok 4 Fast (Non-Reasoning)')?.setting, 'non-reasoning');
  assert.equal(resolve('Grok 4 Fast (No reasoning)')?.setting, 'no reasoning');
  assert.deepEqual(resolve('grok-4-fast-non-reasoning'), { id: 'grok-4-fast', setting: 'non-reasoning' });
});

test('names with no ASCII letters or digits never match', () => {
  assert.equal(resolve('π₀.₅'), null);
});

test('an alias to a model that does not exist is skipped', () => {
  const r = makeResolver({ 'Some Board Name': 'no-such-model' });
  assert.equal(r('Some Board Name'), null);
});
