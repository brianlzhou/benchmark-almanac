// SWE-Marathon-Ext measures how much of a SaaS product an agent can build from a specification.
// Read mean pass rate and the two grading suites from Mercor's own chart descriptions.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const page = 'https://www.mercor.com/blog/swe-marathon-ext-can-ai-build-a-whole-saas-product/';
const harness = 'Terminus on Harbor';
const board: Leaderboard = {
  benchmark: 'swe-marathon-ext-mercor', url: page, feed: page, static: 'paper',
  terms: 'Mercor allows the blog in robots.txt. Its terms restrict scraping and copying at https://www.mercor.com/terms-of-service/.',
  reference: [harness], parts: { deterministic: 'Deterministic backend API', cua: 'Computer-use agent browser interface' },
  async fetch() {
    const html = await fetchText(page);
    const alts = [...html.matchAll(/<img\b[^>]*?\balt="([^"]*)"/g)].map(m => text(m[1]));
    const overall = alts.find(a => a.startsWith('SWE-Marathon-Ext leaderboard.'));
    const split = alts.find(a => a.includes("deterministic backend-API pass rate"));
    if (!overall || !split) throw new Error('Mercor: expected headline and grader charts');
    const entries = (alt: string) => alt.split('with error bars. ')[1]?.split('%. ')[0]?.split(', ') ?? [];
    const rows = entries(overall).map(item => {
      const match = /^(.+?) (\d+(?:\.\d+)?)%?$/.exec(item);
      if (!match) throw new Error('Invalid Mercor chart label: ' + item);
      const model = match[1];
      const grades = entries(split).find(s => s.startsWith(model + ' '))?.slice(model.length + 1).match(/^(\d+)% vs (\d+)%?$/);
      if (!grades) throw new Error('Missing grader scores for ' + model);
      return { model, score: Number(match[2]), trials: 3, harness, metrics: { deterministic: Number(grades[1]), cua: Number(grades[2]) } };
    });
    if (rows.length < 8 || rows.length !== entries(split).length) throw new Error('Incomplete Mercor result charts');
    return rows;
  },
};
export default board;
