import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { FINGERPRINT, INDEXNOW_KEY, changedPaths, formatChanged, formatPages, isProductionDeploy, pageDigest, parseChanged, parsePages, sendToIndexNow } from './indexnow.ts';

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
  const read = (d: string, stars: number) => `<h1>GPQA Diamond</h1><p>Gemini leads with 91.9%<span data-volatile data-astro-cid-x>, read on ${d}</span>.</p><span class="muted" data-volatile="">${stars} stars</span>`;
  assert.equal(pageDigest(page({ main: read('November 24th, 2026', 92) })), pageDigest(page({ main: read('November 26th, 2026', 93) })));
  assert.equal(pageDigest(page({ main: read('November 24th, 2026', 92) })), base);
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
  assert.equal(text.split('\n')[2], '/ aaaaaaaaaaaa');
  assert.deepEqual(parsePages(text), { commit: 'abc123', version: FINGERPRINT, pages: new Map([['/', 'aaaaaaaaaaaa'], ['/b/', 'bbbbbbbbbbbb']]) });
  // the first files had no version line
  assert.deepEqual(parsePages('# commit old\n/ aaaaaaaaaaaa\n'), { commit: 'old', version: 1, pages: new Map([['/', 'aaaaaaaaaaaa']]) });
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

test('a send tries again while the key is unchecked, and stops on a refusal that another try cannot fix', async (t) => {
  const answers: [number, string][] = [[403, '{"errorCode":"SiteVerificationNotCompleted"}'], [200, '']];
  const sent: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    sent.push(JSON.parse(String(init.body)).urlList.join(' '));
    const [status, body] = answers.shift() ?? [422, 'URLs do not belong to the host'];
    return new Response(body, { status });
  });
  await sendToIndexNow(['https://www.benchmarkalmanac.com/'], 0);
  assert.equal(sent.length, 2);
  await assert.rejects(sendToIndexNow(['https://www.benchmarkalmanac.com/'], 0), /answered 422/);
  assert.equal(sent.length, 3);
});
