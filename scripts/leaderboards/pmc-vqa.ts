// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2305.10415';
export default {
  benchmark:'pmc-vqa', static: 'paper',url:'https://arxiv.org/abs/2305.10415',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Method|Language Backbone|Vision Backbone|Choice|Blanking|Blanking' && t[1]?.[4]==='ACC');
    if(!t)throw new Error('PMC-VQA full test results missing');
    const clean=(s:string)=>s.replace(/\s*\[\s*\d+\s*\]/g,'').trim();
    const rows:LeaderboardRow[]=[];let training='';
    for(const r of t.slice(2)){
     if(r.every(c=>c===r[0])){training=r[0];continue;}
     for(const [i,mode] of [[3,'multiple choice']] as const){
      const score=num(r[i]);if(score===undefined)continue;
      const interval=r[i].match(/\(([\d.]+),\s*([\d.]+)\)/);
      rows.push({model:uncertain(clean(r[0])),score,setting:`${mode}; manually verified PMC-VQA-test (2000 questions); ${training}; language backbone ${clean(r[1])}; vision backbone ${clean(r[2])}`,
       ...(interval?{low:Number(interval[1]),high:Number(interval[2])}:{}),metrics:{...(num(r[5])===undefined?{}:{blankingBleu1:num(r[5])!,blankingAccuracy:num(r[4])!})}});
     }
    }
    return checked(rows,3);
  },
} satisfies Leaderboard;
