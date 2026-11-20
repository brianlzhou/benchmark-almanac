// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2312.14115';
export default {
  benchmark:'lingoqa',url:'https://arxiv.org/abs/2312.14115',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.includes('No. Frames') && t[0].includes('Lingo-J'));
    if(!t)throw new Error('LingoQA full evaluation table missing');
    const rows=t.slice(1).filter(r=>r[0]!=='Human').map(r=>({model:r[0]==='LingoQA'?'LingoQA baseline':uncertain(r[0]),score:num(r[4])!,setting:`${r[1]}; ${r[2]} frames`,metrics:{frames:num(r[2])!,bleu:num(r[5])!,meteor:num(r[6])!,cider:num(r[7])!,...(num(r[3])===undefined?{}:{humanScore:num(r[3])!})}}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
