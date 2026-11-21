// DyCodeEval tests coding models on dynamically rewritten problems. Tables 2 and 3
// compare conventional Pass@K with DyPass@K. The headline is the first dynamic metric, DyPass@3.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const url='https://arxiv.org/html/2503.04149';
const board: Leaderboard = {
  benchmark:'dycodeeval',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{dyPassAt3:'DyPass@3',dyPassAt5:'DyPass@5',dyPassAt10:'DyPass@10',passAt3:'Pass@3',passAt5:'Pass@5',passAt10:'Pass@10'},
  async fetch(){
    const ts=paperTables(await paperHtml(url)).map(grid).filter(t=>
      t[0]?.join('|')==='Model|Pass@K|Pass@K|Pass@K|DyPass@K|DyPass@K|DyPass@K' &&
      t[1]?.join('|')==='Model|k=3|k=5|k=10|k=3|k=5|k=10');
    if(ts.length!==2) throw new Error('Missing DyCodeEval comparison tables');
    const data=[...ts[1].slice(2),...ts[0].slice(2).filter(r=>r[0].endsWith(' (C)'))];
    return checked(data.map(([label,...values])=>{
      if(values.length!==6 || values.some(v=>!/^0\.\d+$|^1(?:\.0+)?$/.test(v))) throw new Error('Invalid DyCodeEval rate');
      const [passAt3,passAt5,passAt10,dyPassAt3,dyPassAt5,dyPassAt10]=values.map(v=>Number(v)*100);
      const contaminated=label.endsWith(' (C)');
      return {model:label.replace(/ \(C\)$/,''),setting:contaminated?'Trained on leaked data':'In the wild',
        score:dyPassAt3,metrics:{passAt3,passAt5,passAt10,dyPassAt3,dyPassAt5,dyPassAt10}};
    }),8);
  },
};
export default board;
