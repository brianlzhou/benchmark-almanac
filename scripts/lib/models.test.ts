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
  assert.deepEqual(resolve('GPT-5 mini (Default)'), { id: 'gpt-5-mini', setting: 'default' });
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

test("Claude's tier and version match in either order", () => {
  assert.equal(resolve('Claude Sonnet 3.7')?.id, 'claude-3-7-sonnet');
  assert.equal(resolve('Claude-4.5-Sonnet')?.id, 'claude-sonnet-4-5');
  assert.equal(resolve('Claude-4-Sonnet-20250514')?.id, 'claude-sonnet-4');
  assert.equal(resolve('Claude Haiku 3.5')?.id, 'claude-3-5-haiku');
});

test("a release tag in parentheses is dropped, and its month picks the snapshot", () => {
  assert.equal(resolve('Gemini 2.5 Flash (Apr \'25 Preview)')?.id, 'gemini-2-5-flash-apr-2025');
  assert.equal(resolve('Gemini 2.5 Pro (May \'25 Preview)')?.id, 'gemini-2-5-pro-may-2025');
  assert.equal(resolve("Gemini 3.1 Pro (Feb 26' Preview)")?.id, 'gemini-3-1-pro');
  assert.equal(resolve('DeepSeek V4 Flash (preview)')?.id, 'deepseek-v4-flash');
  // a parenthesis that is neither a tag nor an effort still blocks the match
  assert.equal(resolve('Gemini 3 Pro (some agent)'), null);
});

test("a maker's name before the model's own is dropped, but not a brand that is part of the name", () => {
  assert.equal(resolve('OpenAI o3')?.id, 'o3');
  assert.equal(resolve('OpenAI-o1-mini')?.id, 'o1-mini');
  assert.equal(resolve('Moonshot AI Kimi K2.7 Code')?.id, 'kimi-k2-7-code');
  assert.equal(resolve('Google Gemini 3.8 Flash TTS')?.id, 'gemini-3-8-flash-tts');
  // Qwen's word drops only when it comes twice, so "Qwen 3" never becomes "3"
  assert.equal(resolve('Qwen Qwen3.7-Plus')?.id, 'qwen3-7-plus');
  assert.equal(resolve('Qwen 3'), null);
});

test('a name that carries a setting resolves to the model at that setting', () => {
  assert.deepEqual(resolve('GLM-5.3 Prime'), { id: 'glm-5-3', setting: 'prime', variant: true });
  assert.deepEqual(resolve('z-ai/GLM-5.3 Prime'), { id: 'glm-5-3', setting: 'prime', variant: true });
  // the plain name still means the model with no setting
  assert.equal(resolve('GLM-5.3')?.setting, undefined);
});
