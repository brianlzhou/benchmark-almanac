// IncompeBench tests music retrieval from text descriptions. Table 4 lists nDCG at 10 first.
// Strict and lenient runs use the same queries and different relevance thresholds.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2602.11941';
const measures=['nDCG','MAP','Recall','Precision'].flatMap(name=>[10,50,100].map(k=>name+'@'+k));
const board: Leaderboard = {
  benchmark: 'incompebench', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2602.11941",
  parts:Object.fromEntries(measures.slice(1).map(name=>[name,{name,unit:'score' as const}])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t=tables.find(t=>t[0]?.[1]==='nDCG' && t[0]?.[12]==='Precision');
    if(!t || t[1].slice(1).map((v,i)=>t[0][i+1]+v).join('|')!==measures.join('|')) throw new Error('Missing retrieval measures');
    const rows:LeaderboardRow[]=[];
    let setting='';
    for(const [label,...values] of t.slice(2)){
      if(label==='IncompeBench-Strict' || label==='IncompeBench-Lenient'){setting=label;continue;}
      if(!setting || values.length!==measures.length) throw new Error('Invalid retrieval row');
      const model=label.split(' (')[0];
      rows.push({model,setting,score:numberCell(values[0]),metrics:Object.fromEntries(measures.slice(1).map((k,i)=>[k,numberCell(values[i+1])]))});
    }
    return checked(rows,8);
  },
};
export default board;
