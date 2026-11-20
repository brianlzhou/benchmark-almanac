// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2504.13914';
export default {
  benchmark:'beyond-aime',url:'https://arxiv.org/abs/2504.13914',feed,terms:PAPER_TERMS,
  aliases:{"OpenAI o3-mini": "o3-mini"},
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t.some(r=>r[0]==='Beyond AIME'));
    const result=t?.find(r=>r[0]==='Beyond AIME');
    if(!t || !result)throw new Error('Beyond AIME results missing');
    const rows=t[0].slice(1).flatMap((model,i)=>{const score=num(result[i+1]);return score===undefined?[]:[{model:uncertain(model),score,trials:32,setting:model==='OpenAI o3-mini'?'high effort':undefined}];});
    return checked(rows,3);
  },
} satisfies Leaderboard;
