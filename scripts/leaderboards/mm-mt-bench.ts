// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2410.07073';
export default {
  benchmark:'mm-mt-bench',url:'https://arxiv.org/abs/2410.07073',feed,terms:PAPER_TERMS,
  aliases:{"GPT-4o (0513)": "gpt-4o-may-2024"},
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.includes('MM-MT-Bench'));
    if(!t)throw new Error('MM-MT-Bench table missing');
    const si=t[0].indexOf('MM-MT-Bench');
    const rows=t.slice(2).flatMap(r=>{
     const score=num(r[si]);if(score===undefined)return [];
     const model=r[0].replace(/\s*\[.*?\]/g,'').trim();
     return [{model:uncertain(model),score,setting:'GPT-4o judge'}];
    });
    return checked(rows,3);
  },
} satisfies Leaderboard;
