// Augment Prism is a routed coding system compared with the models it targets.
// The importer reads the published multi-turn coding table in Augment's article.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const PAGE = 'https://www.augmentcode.com/blog/augment-prism-model-routing-to-reduce-cost-and-maintain-quality';
const board: Leaderboard = {
  benchmark: 'prism-multi-turn-coding-augment', url: PAGE, feed: PAGE,
  terms: 'Augment publishes these results in its article. The page does not state separate score reuse terms.',
  static: 'paper', headline: 'Average overall score in Augment Prism multi-turn coding evaluation.',
  async fetch() {
    const t = tables(await fetchText(PAGE)).find(x => x[0]?.[0]?.text === 'Model' && x[0]?.[1]?.text.includes('Avg overall score'));
    if (!t || t.length < 8) throw new Error('Augment Prism overall table missing');
    return t.slice(1).map(r => { const score = num(r[1]?.text?.replace(/[−]/g, '-')); const cost = num(r[2]?.text); if (!r[0]?.text || score === undefined || cost === undefined) throw new Error('Augment Prism row missing score'); return { model: r[0].text, score, cost, metrics: { costPerTask: cost } } satisfies LeaderboardRow; });
  },
};
export default board;
