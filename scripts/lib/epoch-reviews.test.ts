import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewDate, reviewPage, reviewsMap } from '../sync-epoch-reviews.ts';

test('a review date reads in any of the month spellings Epoch uses', () => {
  assert.equal(reviewDate('Aug. 11, 2026'), '2026-08-11');
  assert.equal(reviewDate('Sept. 4, 2026'), '2026-09-04');
  assert.equal(reviewDate('May 2, 2026'), '2026-05-02');
  assert.throws(() => reviewDate('11 August 2026'));
});

test('the reviews map comes out of the search page island props, verdicts and paths kept', () => {
  const props = { cardStats: [0, {}], reviews: [0, { hle: [0, { url: [0, '/benchmarks/hle/review'], verdict: [0, 'flawed'] }], tasteval: [0, { verdict: [0, 'not-enough-info'] }] }] };
  const html = `<astro-island uid="x" props="${JSON.stringify(props).replace(/"/g, '&quot;')}" ssr></astro-island>`;
  assert.deepEqual(reviewsMap(html), { hle: { verdict: 'flawed', url: '/benchmarks/hle/review' }, tasteval: { verdict: 'not-enough-info' } });
  assert.throws(() => reviewsMap('<html>no island</html>'));
});

test('a review page gives its date, creator, verdict and summary', () => {
  const html =
    '<meta name="description" content="After auditing 48 questions, we found that 22 (46%) had errors, leading us to designate the benchmark as Flawed.">' +
    '<p class="review-fact"><strong>Reviewed: </strong><span>Aug. 11, 2026</span></p>' +
    '<p class="review-fact"><strong>Benchmark creator: </strong><span>Center for AI Safety, Scale AI</span></p>' +
    '<p class="review-fact"><strong>Verdict: </strong><span class="review-badge review-badge-flawed trim">';
  assert.deepEqual(reviewPage(html), {
    reviewed: '2026-08-11',
    creator: 'Center for AI Safety, Scale AI',
    verdict: 'flawed',
    summary: 'After auditing 48 questions, we found that 22 (46%) had errors, leading us to designate the benchmark as Flawed.',
  });
});
