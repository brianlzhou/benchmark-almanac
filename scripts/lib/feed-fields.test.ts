// Tests for the field watch: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { begin, kindOf, noise, observe, review } from './feed-fields.ts';

test('field names map to the kind of fact they hold', () => {
  assert.equal(kindOf('avgCostUsd'), 'cost');
  assert.equal(kindOf('ci_lower'), 'uncertainty');
  assert.equal(kindOf('trajectory_url'), 'link');
  assert.equal(kindOf('model_name'), undefined);
});

test('yes/no flags, metric notes and model page links are noise', () => {
  const none = new Set<string>();
  assert.equal(noise('hasAgentName', 'harness or agent', none), true);
  assert.equal(noise('lower_is_better', 'uncertainty', none), true);
  assert.equal(noise('canonicalUrl', 'link', none), true);
  assert.equal(noise('trajectory_url', 'link', none), false);
  assert.equal(noise('is_open', 'open weights, license or size', none), false);
});

test("an organization is the model's maker on a board of bare models, and the agent's maker on an agent board", () => {
  assert.equal(noise('organization', 'submitter or agent maker', new Set()), true);
  assert.equal(noise('organization', 'submitter or agent maker', new Set(['harness or agent'])), false);
  assert.equal(noise('submitter', 'submitter or agent maker', new Set()), false);
});

test('review flags a cost the rows do not store, and skips noise', () => {
  begin();
  const records = [1, 2, 3].map((i) => ({ model: `m${i}`, score: i, avgCostUsd: i / 10, hasAgentName: false, url: `https://x.test/m${i}` }));
  observe('https://x.test/feed.json', JSON.stringify(records));
  const { flags } = review([{ model: 'm1', score: 1 }], undefined, new Set());
  assert.deepEqual(
    flags.map((f) => f.field),
    ['avgCostUsd'],
  );
});
