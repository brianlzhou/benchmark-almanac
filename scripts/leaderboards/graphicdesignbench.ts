// GraphicDesignBench evaluates graphic design understanding and generation.
// The first results table (Table 5) mixes accuracy, count errors, detection AP,
// and rank correlations. Use its first measure, aspect-ratio accuracy, as the headline.
import type { Leaderboard, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed='https://arxiv.org/html/2604.04192';
const names=['Aspect ratio accuracy','Aspect ratio F1','Element counting MAE','Element counting MSE',
  'Component type accuracy','Component type F1','Component detection mAP at 0.5','Component detection mAP at 0.5 to 0.95',
  'Text component AP','Image component AP','Layer order Kendall tau','Layer order Spearman rho'];
export default {
  benchmark:'graphicdesignbench',url:feed,feed,static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2604.04192',
  headline:'The paper reports task-specific measures. The headline is aspect-ratio classification accuracy on 989 designs, the first measure in Table 5.',
  parts:Object.fromEntries(names.map((name,i)=>['layout'+i,{name,unit:'score',better:i===2||i===3?'lower':'higher'}])) as Record<string,BoardPart>,
  async fetch() {
    const t=paperTables(await paperHtml(feed)).map(grid).find(t=>t[0][1]==='Aspect Ratio' && t[0][3]==='Elem. Counting');
    if(!t || t[1][1]!=='Acc\\uparrow') throw new Error('Missing layout scores');
    const middle=t.findIndex(c=>c[1]==='Component Detection');
    if(middle<0 || t[middle][5]!=='Layer Order') throw new Error('Missing detection or layer ordering columns');
    const rows=t.slice(2,middle).map(([model,...first])=>{
      const second=t.slice(middle+2).find(c=>c[0]===model);
      if(!second || first.length!==6 || second.length!==7) throw new Error('Incomplete metrics for '+model);
      const values=[...first,...second.slice(1)].map(numberCell);
      return {model,score:values[0],metrics:Object.fromEntries(values.map((n,i)=>['layout'+i,n]))};
    });
    return checked(rows,4);
  },
} satisfies Leaderboard;
