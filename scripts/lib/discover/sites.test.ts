// Tests for reading the sites of cataloged makers: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRobots, allowed, parseSitemap, pageRank, pageFinds, SKIP_HOSTS } from './sites.ts';
import { WIDE_GENERAL } from './papers.ts';

test('robots.txt: this reader follows its own group when there is one, else the group for every agent', () => {
  const txt = ['User-agent: *', 'Disallow: /private/', 'Allow: /private/press/', '', 'User-agent: GPTBot', 'Disallow: /', '', 'Sitemap: https://example.org/sitemap.xml'].join('\n');
  const r = parseRobots(txt);
  assert.deepEqual(r.sitemaps, ['https://example.org/sitemap.xml']);
  assert.equal(allowed(r, '/blog/new-bench'), true);
  assert.equal(allowed(r, '/private/notes'), false);
  // the longer rule wins
  assert.equal(allowed(r, '/private/press/launch'), true);
  const own = parseRobots('User-agent: *\nAllow: /\n\nUser-agent: benchmark-almanac\nDisallow: /');
  assert.equal(allowed(own, '/anything'), false);
});

test('robots.txt wildcards and end anchors', () => {
  const r = parseRobots('User-agent: *\nDisallow: /*.pdf$\nDisallow: /search*');
  assert.equal(allowed(r, '/paper.pdf'), false);
  assert.equal(allowed(r, '/paper.pdf.html'), true);
  assert.equal(allowed(r, '/search?q=bench'), false);
});

test('a sitemap index lists child sitemaps, and a url set lists pages with their dates', () => {
  const index = parseSitemap('<sitemapindex><sitemap><loc>https://a.org/post-sitemap.xml</loc><lastmod>2026-11-20T10:00:00Z</lastmod></sitemap></sitemapindex>');
  assert.equal(index.index, true);
  assert.deepEqual(index.entries, [{ url: 'https://a.org/post-sitemap.xml', date: '2026-11-20' }]);
  const set = parseSitemap('<urlset><url><loc><![CDATA[https://a.org/blog/new?x=1&amp;y=2]]></loc></url></urlset>');
  assert.deepEqual(set.entries, [{ url: 'https://a.org/blog/new?x=1&y=2', date: undefined }]);
});

test('benchmark pages rank above posts, and tag pages and files are skipped', () => {
  assert.equal(pageRank('https://cursor.com/cursorbench'), 2);
  assert.equal(pageRank('https://metr.org/blog/2026-11-20-q4-2026-capability-update/'), 1);
  assert.equal(pageRank('https://a.org/tags/benchmarks'), 0);
  assert.equal(pageRank('https://a.org/report.pdf'), 0);
  assert.equal(pageRank('https://a.org/'), 0);
});

test('a page that launches a benchmark gives its name', () => {
  const html =
    '<html><head><title>FrontierBreach | PromptArmor</title></head><body><main><p>Today we are releasing FrontierBreach, a benchmark of prompt injection in enterprise agent tasks. We evaluate 22 models.</p></main></body></html>';
  const f = pageFinds(html, 'https://www.promptarmor.com/frontier-breach');
  assert.deepEqual(f.names, ['FrontierBreach']);
  assert.equal(f.introduced, true);
});

test('a page that names no benchmark gives nothing', () => {
  const html = '<html><head><title>We raised our Series B</title></head><body><main><p>We are hiring engineers.</p></main></body></html>';
  assert.deepEqual(pageFinds(html, 'https://a.org/blog/series-b').names, []);
});

test('a leaderboard page is named by its title without the page words, or by its address', () => {
  const page = (title: string) => `<html><head><title>${title}</title></head><body><main><p>Scores for 20 models.</p></main></body></html>`;
  assert.deepEqual(pageFinds(page('Financial Coaching Bench Leaderboard and Methodology'), 'https://www.vals.ai/benchmarks/financial-coaching-bench').names, ['Financial Coaching Bench']);
  assert.deepEqual(pageFinds(page('Ramp SWE-Bench v2'), 'https://labs.ramp.com/swebench').names, ['Ramp SWE-Bench v2']);
  assert.deepEqual(pageFinds(page('Cursor'), 'https://cursor.com/cursorbench').names, ['cursorbench']);
});

test('explainers and one model\'s results page are not launches', () => {
  const page = (title: string) => `<html><head><title>${title}</title></head><body><main><p>Today we introduce nothing new.</p></main></body></html>`;
  assert.deepEqual(pageFinds(page('Inverted Index Explained'), 'https://parallel.ai/learn/inverted-index').names, []);
  assert.deepEqual(pageFinds(page('Grok Voice 3.0 on Speech-to-Speech Benchmark'), 'https://benchmarks.cekura.ai/speech-to-speech/real-calls/grok-realtime-3').names, []);
});

test('code, paper and social hosts, and sites whose terms forbid reading, are skipped', () => {
  for (const h of ['github.com', 'arxiv.org', 'huggingface.co', 'openai.com', 'www.anthropic.com'.replace(/^www\./, ''), 'kaggle.com', 'foo.substack.com']) assert.equal(SKIP_HOSTS.test(h), true, h);
  for (const h of ['metr.org', 'cursor.com', 'vals.ai']) assert.equal(SKIP_HOSTS.test(h), false, h);
});

test('a robotics or vision paper counts when it tests the models the almanac covers', () => {
  assert.equal(WIDE_GENERAL.test('We benchmark 12 vision-language-action policies on long-horizon tasks'), true);
  assert.equal(WIDE_GENERAL.test('A benchmark for crowd counting in dense scenes'), false);
});
