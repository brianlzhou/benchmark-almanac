// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2602.11685';
export default {
  benchmark:'draco', static: 'paper',url:'https://arxiv.org/abs/2602.11685',feed,terms:PAPER_TERMS,
  harnesses:'system', reference:['Anthropic search and code tools'],
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='System|Normalized Score');
    const usage=ts.find(t=>t[0]?.join('|')==='System|Avg Input Tokens|Avg Output Tokens|Avg Latency (s)');
    const pass=ts.find(t=>t[0]?.join('|')==='System|Pass Rate');
    if(!t || !usage || !pass)throw new Error('DRACO results missing');
    const rows=t.slice(1).map(r=>{
     const u=usage.find(u=>u[0]===r[0]);const p=pass.find(p=>p[0]===r[0]);
     const m=r[0].match(/^(Perplexity|OpenAI) Deep Research \(([^)]+)\)$/);
     const model=m?(m[1]==='Perplexity'?'Claude '+m[2]:m[2]):r[0];
     return {model,score:num(r[1])!,harness:m?m[1]+' Deep Research':r[0].startsWith('Claude')?'Anthropic search and code tools':'Gemini Deep Research',tokens:num(u?.[2]),metrics:{std:num(r[1].split('\\pm')[1])!,passRate:num(p?.[1])!,inputTokens:num(u?.[1])!,latency:num(u?.[3])!}};
    });
    return checked(rows,3);
  },
} satisfies Leaderboard;
