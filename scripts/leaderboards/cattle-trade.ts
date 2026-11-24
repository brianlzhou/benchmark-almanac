// Cattle Trade tests bargaining and bidding in a multiplayer game. Figure 1b ranks by TrueSkill mean.
// Read the figure's text table for the canonical 98 games and Table 3 for strategic behavior.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2605.14537';
const names: Record<string,string> = {
  'G3-F': 'Gemini 3 Flash', 'G3.1-FL': 'Gemini 3.1 Flash Lite', 'Sonnet 4.5': 'Claude Sonnet 4.5',
  'DS-v3.2': 'DeepSeek v3.2', 'GPT5.4-N': 'GPT-5.4 Nano', 'Haiku 4.5': 'Claude Haiku 4.5',
  'G2.5-FL': 'Gemini 2.5 Flash Lite',
};
function pair(cell: string) {
  const clean = cell.replaceAll('\\!', '').replaceAll('{,}', '').replaceAll('\\phantom{0}', '');
  const values = clean.split('\\pm').map(Number);
  if (values.length !== 2 || !values.every(Number.isFinite)) throw new Error('Invalid ranking cell: ' + cell);
  return values;
}
export default {
  benchmark: 'cattle-trade', static: 'paper', url: feed, feed,
  terms: 'Paper and license at https://arxiv.org/abs/2605.14537',
  headline: 'The authors rank agents by their TrueSkill mean across the 98 canonical games.',
  stats: {
    median: { name: 'Median game score', unit: 'score', better: 'higher' },
    gameStd: { name: 'Game score standard deviation', unit: 'score' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const ranking = tables.find(t => t[0][0] === 'Agent' && t[0][1].startsWith('TS') && t[0][2].startsWith('Median'));
    const profile = tables.find(t => t[0].join('|') === 'Agent|Bid Agg.|Buy-Right|TC-Accept|Bluff%|Self-Bid|Spend Eff.|Overbid%');
    if (!ranking || !profile) throw new Error('Missing Cattle Trade ranking or profile');
    const rows: LeaderboardRow[] = [];
    for (const [name, rating, points] of ranking.slice(1)) {
      if (name.startsWith('C:')) continue;
      const model = names[name];
      const behavior = profile.find(r => r[0] === model);
      if (!model || !behavior) throw new Error('Unknown ranking entry ' + name);
      const [score,std] = pair(rating), [median,gameStd] = pair(points);
      const metrics: Record<string,number> = {std,median,gameStd};
      const keys = ['bidAggression','buyRight','tcAccept','bluff','selfBid','spendingEfficiency','overbid'];
      keys.forEach((key,i) => {
        const value = Number(behavior[i+1].replace('%',''));
        if (!Number.isFinite(value)) throw new Error('Invalid behavior metric');
        metrics[key] = value;
      });
      rows.push({model: name === 'G3-F' || name === 'G3.1-FL' ? model + ' Preview' : model, score, metrics, setting: 'Canonical games'});
    }
    return checked(rows,7);
  },
} satisfies Leaderboard;
