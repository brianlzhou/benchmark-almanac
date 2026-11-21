// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2408.10943';
export default {
  benchmark:'sysbench', static: 'paper',url:'https://arxiv.org/abs/2408.10943',feed,terms:PAPER_TERMS,
  aliases:{"GPT4-Turbo-20240409":"gpt-4-turbo-apr-2024","GPT3.5-Turbo-20231106":"gpt-3-5-turbo-nov-2023"},
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Model Name|CSR|ISR|SSR|Model Name|CSR|ISR|SSR');
    if(!t)throw new Error('SysBench results missing');
    const rows=t.slice(1).flatMap(r=>[0,4].map(i=>({model:uncertain(r[i].replace(/\s*†/g,'').replace(/^GPT4o$/,'GPT-4o')),score:num(r[i+2])!,metrics:{constraintSatisfaction:num(r[i+1])!,sessionSatisfaction:num(r[i+3])!}})));
    return checked(rows,3);
  },
} satisfies Leaderboard;
