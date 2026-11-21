// LAMBADA Multilingual tests language-model prediction across eight languages.
// Table 5 of the Stable LM 2 paper reports accuracy for the all-language aggregate and each language.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2402.17834';
export default {
  benchmark: 'lambada-multilingual-stable-lm-2', static: 'paper', url: feed, feed,
  terms: 'Paper and license at https://arxiv.org/abs/2402.17834',
  parts: { EN: 'English', DE: 'German', ES: 'Spanish', FR: 'French', IT: 'Italian', NL: 'Dutch', PT: 'Portuguese' },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|All|EN|DE|ES|FR|IT|NL|PT');
    if (!table) throw new Error('Missing Stable LM multilingual table');
    const rows = table.slice(1).map(c => ({ model: c[0], score: Number(c[1]), metrics: { EN: Number(c[2]), DE: Number(c[3]), ES: Number(c[4]), FR: Number(c[5]), IT: Number(c[6]), NL: Number(c[7]), PT: Number(c[8]) } }));
    if (rows.some(r => !Number.isFinite(r.score) || Object.values(r.metrics!).some(v => !Number.isFinite(v)))) throw new Error('Invalid LAMBADA multilingual score');
    return checked(rows, 10);
  },
} satisfies Leaderboard;
