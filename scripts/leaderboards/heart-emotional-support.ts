// HEART measures preference for emotional support responses in pairwise comparisons.
// Table 1 publishes the authors’ HEART Elo ratings and win percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.19922';

const board: Leaderboard = {
  benchmark: 'heart-emotional-support', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2601.19922",
  parts:{winRate:{name:'Win rate',unit:'%'}},
  aliases:{'GPT - o3':'o3','GPT - 5':'gpt-5','GPT - 4.1 mini':'gpt-4-1-mini','Claude 4.5 Haiku':'claude-haiku-4-5','Claude 4.5 Sonnet':'claude-sonnet-4-5','Claude 4 Opus':'claude-opus-4','Llama - 4 Maverick':'llama-4-maverick','Llama - 3.1 - 405B':'llama-3-1-405b','Llama - 3.1 - 70B':'llama-3-1-70b'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.slice(0,3).join('|') === 'Model|HEART Elo|Win%');
    if (!table) throw new Error('Missing HEART Elo and win rate');
    const rows:LeaderboardRow[] = table.slice(1).map(([name,elo,pct]) => {
      if (!pct.endsWith('%')) throw new Error('Invalid win rate');
      const model = name === 'GPT - 4o' ? 'GPT-4o (snapshot unspecified)' : name;
      return {model,score:numberCell(elo),metrics:{winRate:numberCell(pct.slice(0,-1))}};
    });
    return checked(rows,15);
  },
};
export default board;
