// Models choose negotiation partners and carry a relationship history across games.
// The README reports whole-match scores and paired differences from two reference policies on the same seeds.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/hanjin-kim/nego-eval/main/README.md';
function difference(cell: string) {
  const m = cell.replace('−', '-').match(/^([+-]?\d+)\s*±\s*(\d+)$/);
  if (!m) throw new Error('Missing paired difference or standard error');
  return [Number(m[1]), Number(m[2])];
}
const board: Leaderboard = {
  benchmark: 'nego-eval', feed, url: 'https://github.com/hanjin-kim/nego-eval',
  terms: 'Business Source License 1.1. https://github.com/hanjin-kim/nego-eval/blob/main/LICENSE',
  headline: 'Whole-match scores from the original system prompt, which the author later corrected.',
  stats: {
    vsRule: { name: 'Difference from hand-written rule', unit: 'score', better: 'higher' },
    vsRuleSE: { name: 'Standard error of difference from rule', unit: 'score' },
    vsQuote: { name: 'Difference from quote sheet only', unit: 'score', better: 'higher' },
    vsQuoteSE: { name: 'Standard error of difference from quote sheet', unit: 'score' },
  },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model|n|Score|vs the rule|vs quote sheet only');
    if (!table) throw new Error('Missing whole-match model table');
    return checked(table.slice(1).map(([model, n, score, rule, quote]) => {
      if (!/^\d+$/.test(n) || !/^-?\d+$/.test(score)) throw new Error('Invalid match count or score');
      const [vsRule, vsRuleSE] = difference(rule);
      const [vsQuote, vsQuoteSE] = difference(quote);
      return { model, trials: Number(n), score: Number(score), metrics: { vsRule, vsRuleSE, vsQuote, vsQuoteSE } };
    }), 7);
  },
};
export default board;
