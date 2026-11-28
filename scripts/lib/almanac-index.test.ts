// Tests for the Almanac Index's math (src/lib/almanac-index.ts) on a small made-up catalog: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRecipe, rank, recipeText, NOT_YET, type IndexBench, type IndexInput } from '../../src/lib/almanac-index.ts';

const CUTOFF = '2026-10-31';

function bench(id: string, sub: string, extra: Partial<IndexBench> = {}): IndexBench {
  return {
    id, name: id, family: null, area: 'coding', category: 'coding', subcategory: sub, unit: '%', better: 'higher', successor: null,
    released: '2026-01', construct: 'capability', risk: ['none'], propensity: ['none'], combines: false, runner: 'third-party', basis: 'original', subject: ['none'],
    ...extra,
  };
}

/** 30 models with abilities from -2 to 2, scored on each test as ability minus difficulty on the logit scale. */
function catalog(): IndexInput {
  const swe = ['swe-a', 'swe-b', 'swe-c', 'swe-d'].map((id) => bench(id, 'coding-repositories'));
  const math = ['math-a', 'math-b', 'math-c', 'math-d'].map((id) => bench(id, 'math-competition', { area: 'math', category: 'math' }));
  const odd = [
    bench('easy', 'coding-repositories'), // everyone near 100: saturated
    bench('few', 'coding-repositories'), // five models: too few
    bench('late', 'coding-repositories', { released: '2026-11' }), // released after the cutoff
    bench('own', 'coding-repositories', { runner: 'developer' }), // a lab's internal test
    bench('tb-1', 'coding-repositories', { family: 'tb', released: '2026-02' }),
    bench('tb-2', 'coding-repositories', { family: 'tb', released: '2026-08' }),
  ];
  const benches = [...swe, ...math, ...odd];
  const models = Array.from({ length: 30 }, (_, i) => ({ id: `m${i}`, name: `Model ${i}`, lab: `lab${i % 6}`, labName: `Lab ${i % 6}`, released: `2026-${String(1 + (i % 9)).padStart(2, '0')}-15` }));
  const ability = (i: number) => -2 + (4 * i) / 29;
  const score = (i: number, d: number) => Math.round(1000 / (1 + Math.exp(-(ability(i) - d)))) / 10;
  const ind: IndexInput['ind'] = {};
  const lab: IndexInput['lab'] = {};
  const put = (b: string, i: number, v: number) => ((ind[b] ??= {})[`m${i}`] = v);
  benches.forEach((b, k) => {
    for (let i = 0; i < 30; i++) {
      if (b.id === 'few' && i >= 5) continue;
      // model 29 has only two math scores and no coding scores, so it cannot rank overall
      if (i === 29 && !['math-a', 'math-b'].includes(b.id)) continue;
      put(b.id, i, b.id === 'easy' ? 99 : score(i, (k % 4) * 0.5 - 0.5));
    }
  });
  // labs cite some tests in launch posts and system cards
  const cites: IndexInput['cites'] = [];
  const cite = (b: string, n: number, kind: 'launch' | 'system-card', date = '2026-09-01') => {
    for (let l = 0; l < n; l++) cites.push({ bench: b, kind, release: `${b}-${l}`, lab: `lab${l}`, date });
  };
  cite('swe-a', 6, 'launch');
  cite('math-a', 5, 'launch');
  cite('swe-b', 3, 'system-card');
  cite('tb-1', 4, 'launch', '2026-03-01'); // labs cited the old version early in the year
  cite('tb-2', 3, 'launch', '2026-09-15'); // and the new one recently
  return { asOf: '2026-11-28', benches, models, ind, lab, cites };
}

test('tests that cannot count say why', () => {
  const r = makeRecipe(catalog(), '26.11', CUTOFF);
  const why = (b: string) => Object.entries(r.status).find(([, ids]) => ids.includes(b))?.[0];
  assert.match(why('easy') ?? '', /^saturated/);
  assert.match(why('few') ?? '', /^fewer than 8/);
  assert.equal(why('late'), NOT_YET);
  assert.match(why('own') ?? '', /internal test/);
  for (const b of ['swe-a', 'math-a', 'tb-1', 'tb-2']) assert.ok(r.tests[b], `${b} counts`);
});

test('citations pool over a family, and a board takes the version labs moved to', () => {
  const r = makeRecipe(catalog(), '26.11', CUTOFF);
  // [weight, relevance, launchLabs, ...]: both versions carry the family's labs
  assert.equal(r.tests['tb-1'][2], r.tests['tb-2'][2]);
  assert.equal(r.tests['tb-2'][2], 4);
  const swe = r.domains.find((d) => d.id === 'swe')!;
  const ids = swe.ref.map(([b]) => b);
  assert.ok(ids.includes('tb-2') && !ids.includes('tb-1'), `board holds the newer version: ${ids.join(', ')}`);
  // the most cited test weighs most
  const w = (b: string) => r.tests[b][0];
  assert.ok(w('swe-a') > w('swe-d'));
});

test('a model with too few domains does not rank overall, and fills stay on the scale', () => {
  const inp = catalog();
  const R = rank(inp, makeRecipe(inp, '26.11', CUTOFF));
  assert.ok(R.head.length > 20);
  assert.ok(!R.head.some((x) => x.model === 'm29'), 'm29 has scores in one domain only');
  for (const x of [...R.head, ...R.provisional]) for (const [v] of Object.values(x.parts)) assert.ok(v >= 0 && v <= 100);
  // abilities rise with the model number, so the strongest model leads
  assert.equal(R.head[0].model, 'm28');
});

test('a frozen version keeps its tests when new ones arrive', () => {
  const inp = catalog();
  const r = makeRecipe(inp, '26.11', CUTOFF);
  const later = { ...inp, benches: [...inp.benches, bench('swe-new', 'coding-repositories', { released: '2026-11' })], ind: { ...inp.ind, 'swe-new': inp.ind['swe-a'] } };
  const R = rank(later, r);
  const swe = R.domainRows.get('swe')!;
  assert.equal(swe[0].parts.length, r.domains.find((d) => d.id === 'swe')!.ref.length);
  assert.ok(!r.tests['swe-new']);
});

test('a recipe file reads back the same', () => {
  const r = makeRecipe(catalog(), '26.11', CUTOFF);
  assert.deepEqual(JSON.parse(recipeText(r)), JSON.parse(JSON.stringify(r)));
});
