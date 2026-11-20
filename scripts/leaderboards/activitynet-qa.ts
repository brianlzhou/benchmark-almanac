// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/1906.02467';
export default {
  benchmark:'activitynet-qa', parts: {
  motion: { name: 'Motion', group: 'Task type' },
  spatial: { name: 'Spatial', group: 'Task type' },
  temporal: { name: 'Temporal', group: 'Task type' },
  free: { name: 'Free', group: 'Task type' },
},url:'https://arxiv.org/abs/1906.02467',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[1]?.includes('All') && t[1].includes('WUPS@0.9'));
    if(!t)throw new Error('ActivityNet-QA results missing');
    const rows=t.slice(2).filter(r=>r[0]!=='Q-type prior').map(r=>({model:r[0],score:num(r[6])!,metrics:{motion:num(r[1])!,spatial:num(r[2])!,temporal:num(r[3])!,free:num(r[4])!,wups09:num(r[8])!,wups0:num(r[9])!}}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
