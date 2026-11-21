// InstructIR tests retrieval when different instructions accompany the same query.
// Table 3 ranks zero-shot retrieval by Robustness@10 and reports nDCG@10 on the same 0 to 100 scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2402.14334';

const board: Leaderboard = {
  benchmark: 'instructir', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2402.14334",
  parts:{ndcg10:{name:'nDCG@10',unit:'score'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const t=tables.find(t=>t[0]?.join('|')==='Instruction-tuned|Type|Models|Size|Robustness@10|nDCG@10');
    if(!t) throw new Error('Missing InstructIR zero-shot results');
    const rows:LeaderboardRow[]=t.slice(1).filter(r=>r[2]!=='BM25').map(([,,model,size,robustness,ndcg])=>{
      const m=size.match(/^(\d+(?:\.\d+)?)([MB])$/);
      if(!m) throw new Error('Invalid model size');
      return {model,score:numberCell(robustness),setting:'Zero-shot',params:Number(m[1])/(m[2]==='M'?1000:1),metrics:{ndcg10:numberCell(ndcg)}};
    });
    return checked(rows,11);
  },
};
export default board;
