// Tests for reading launches from newsletter posts: run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchSite } from './newsletters.ts';

test('a launch post that names its benchmark only by the site it links', () => {
  // Dwarkesh Patel's post of 2026-11-05 never writes "Clocktower Bench"
  const html = '<a href="https://github.com/dwarkeshsp/clocktower">use my code</a> <a href="https://play.clocktowerbench.com">I built a website</a>';
  assert.deepEqual(launchSite(html, 'The benchmark where AIs have to lie to win'), { name: 'Clocktower Bench', url: 'https://clocktowerbench.com/' });
});

test('a post whose title is not about a benchmark launches nothing', () => {
  assert.equal(launchSite('<a href="https://clocktowerbench.com/">x</a>', 'What Robert Caro learned about power'), undefined);
});
