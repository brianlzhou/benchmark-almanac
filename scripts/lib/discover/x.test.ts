// Tests for reading Grok's X search answer: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { X_SEARCHES, postLinks, xLaunches, xPrompt, xSlices } from './x.ts';

test('makes one run for each part and day, newest first, and skips the runs an earlier scan finished', () => {
  const got = xSlices('2026-11-20', '2026-11-22', ['2026-11-21 launches']);
  const parts = Object.keys(X_SEARCHES).length;
  assert.equal(got.length, 3 * parts - 1);
  assert.deepEqual(got[0], { day: '2026-11-22', part: 'launches' });
  assert.equal(got.at(-1)!.day, '2026-11-20');
  assert.ok(!got.some((s) => s.day === '2026-11-21' && s.part === 'launches'));
  assert.deepEqual(xSlices('2026-11-23', '2026-11-22'), []);
});

test('asks for one day, with X date filters that cross a month', () => {
  const p = xPrompt('2026-11-30', 'fields');
  assert.match(p, /posts made on 2026-11-30 \(UTC\), with since:2026-11-30 until:2026-12-01/);
  assert.match(p, /"medicine OR law OR finance OR security"/);
});

test('reads answers Grok wrote one after another in the text, past an empty placeholder', () => {
  // the shape of a run on 2026-11-23 that failed with "Unexpected non-whitespace character after JSON"
  const hyper = { name: 'Hyper-Intervention', org: 'Hyperstition', post_url: 'https://x.com/hyperstition_cc/status/2123877109907288098', links: ['https://github.com/Hyperstitioncc/HyperIntervention'], date: '2026-11-20' };
  const out = JSON.stringify({
    text: `{"launches":[]}{"launches":[${JSON.stringify(hyper)}]} {"launches":[{"name":"Not {json"`,
    structuredOutput: { launches: [{ name: '', post_url: '', links: [], date: '' }] },
  });
  const got = xLaunches(out);
  assert.equal(got.length, 1);
  assert.equal(got[0].name, 'Hyper-Intervention');
  assert.deepEqual(got[0].links, ['https://github.com/Hyperstitioncc/HyperIntervention']);
  assert.deepEqual(xLaunches('not json'), []);
});

test('reads the non-X links in a post', () => {
  const text = 'Every task and score: https://www.benchflow.ai/weightbench.\nTasks: https://github.com/benchflow-ai/benchmarks/tree/main/datasets/weightbench (graders) https://x.com/xdotli/status/1 https://t.co/abc';
  assert.deepEqual(postLinks(text), ['https://www.benchflow.ai/weightbench', 'https://github.com/benchflow-ai/benchmarks/tree/main/datasets/weightbench']);
});

test('keeps launches with an X post and drops X links from the source links', () => {
  // the shape of Grok Build's `--output-format json` answer on 2026-11-06
  const out = JSON.stringify({
    text: '',
    structuredOutput: {
      launches: [
        { name: 'DeepFinance', org: 'Julius Research', post_url: 'https://x.com/0interestrates/status/2118473925902635507', links: ['https://www.juliusresearch.ai/blog/deep-finance', 'https://x.com/0interestrates/status/2118473925902635508', 'https://t.co/abc'], date: '2026-11-05', likes: 586 },
        { name: 'No post', post_url: 'https://example.com/post', links: [], date: '2026-11-05' },
      ],
    },
  });
  const got = xLaunches(out);
  assert.equal(got.length, 1);
  assert.deepEqual(got[0].links, ['https://www.juliusresearch.ai/blog/deep-finance']);
});
