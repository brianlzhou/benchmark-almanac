import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { INDEXNOW_KEY, changedPaths, formatChanged, formatPages, isProductionDeploy, pageDigest, parseChanged, parsePages } from './indexnow.ts';

const page = (o: { title?: string; head?: string; main?: string; foot?: string }) =>
  `<html><head><title>${o.title ?? 'GPQA Diamond leaderboard'}</title><meta name="description" content="Who leads GPQA Diamond."><link rel="stylesheet" href="/_astro/a1.css"></head>` +
  `<body><header>${o.head ?? 'Cite: retrieved November 25, 2026'}</header><main>${o.main ?? '<h1>GPQA Diamond</h1><p>Gemini leads with 91.9%.</p>'}</main>` +
  `<footer>${o.foot ?? '6,682 benchmarks. Data as of November 25, 2026.'}</footer></body></html>`;

test('a page fingerprint follows the indexed text and ignores the header, footer, scripts and markup', () => {
  const base = pageDigest(page({}));
  assert.match(base, /^[0-9a-f]{12}$/);
  assert.equal(pageDigest(page({ head: 'Cite: retrieved November 26, 2026', foot: '6,700 benchmarks. Data as of November 26, 2026.' })), base);
  assert.equal(pageDigest(page({ main: '<h1 class="x">GPQA Diamond</h1>\n<p data-v="1">Gemini leads with <b>91.9%</b>.</p><script src="/_astro/b2.js"></script>' })), base);
  assert.notEqual(pageDigest(page({ main: '<h1>GPQA Diamond</h1><p>Gemini leads with 92.1%.</p>' })), base);
  assert.notEqual(pageDigest(page({ title: 'GPQA Diamond leaderboard and scores (December 2026)' })), base);
});

test('changed pages are the new ones and the ones whose fingerprint moved', () => {
  const live = new Map([['/a/', '1'], ['/b/', '2'], ['/gone/', '3']]);
  const next = new Map([['/a/', '1'], ['/b/', '9'], ['/new/', '4']]);
  assert.deepEqual(changedPaths(live, next), ['/b/', '/new/']);
  assert.deepEqual(changedPaths(null, next), ['/a/', '/b/', '/new/']);
});

test('the page and list files read back what was written', () => {
  const pages = new Map([['/b/', 'bbbbbbbbbbbb'], ['/', 'aaaaaaaaaaaa']]);
  const text = formatPages('abc123', pages);
  assert.equal(text.split('\n')[1], '/ aaaaaaaaaaaa');
  assert.deepEqual(parsePages(text), { commit: 'abc123', pages: new Map([['/', 'aaaaaaaaaaaa'], ['/b/', 'bbbbbbbbbbbb']]) });
  assert.throws(() => parsePages('<!doctype html><html>'), /no commit line/);
  assert.deepEqual(parseChanged(formatChanged('abc123', 'none', ['/x/', '/y/'])), { commit: 'abc123', base: 'none', paths: ['/x/', '/y/'] });
});

test('only a finished Vercel deploy of a commit on main counts as a production deploy', () => {
  const main = [{ name: 'main' }];
  assert.equal(isProductionDeploy({ context: 'Vercel', state: 'success', branches: main }), true);
  assert.equal(isProductionDeploy({ context: 'Vercel', state: 'pending', branches: main }), false);
  assert.equal(isProductionDeploy({ context: 'Vercel', state: 'success', branches: [{ name: 'feat/x' }] }), false);
  assert.equal(isProductionDeploy({ context: 'check', state: 'success', branches: main }), false);
});

test('the key file the site serves holds the key', () => {
  const file = new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url);
  assert.ok(existsSync(file), `public/${INDEXNOW_KEY}.txt is missing`);
  assert.equal(readFileSync(file, 'utf8'), INDEXNOW_KEY);
});
