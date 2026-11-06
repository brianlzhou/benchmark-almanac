// Tests for reading Grok's X search answer: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xLaunches } from './x.ts';

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
