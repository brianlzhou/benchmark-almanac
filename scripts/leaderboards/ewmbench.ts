// EWMBench evaluates scene, motion and semantics in generated videos of embodied tasks.
// Table 2 reports an overall composite score. The importer preserves that score on its native scale.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.09694';
const names = ['SceneC','HSD','Dyn','nDTW','Motion Avg.','Diversity','BLEU','CLIP','Logics','Semantics Avg.'];
const board: Leaderboard = {
  benchmark:'ewmbench', static:'paper', url:feed, feed, terms:PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts:Object.fromEntries(names.map(name=>[name,{name,unit:'score',note:'Original Table 2 score.'}])),
  headline:'Table 2 ranks models by its overall composite score on the original scale.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t=>t[1]?.join('|')==='Type|Model|SceneC|HSD|Dyn|nDTW|Avg.|Diversity|BLEU|CLIP|Logics|Avg.|Overall');
    if (!table) throw Error('Missing Table 2 results');
    return checked(table.slice(2).map(([type,label,...cells])=>{
      if (cells.length !== names.length+1) throw Error('Incomplete model row');
      const values = cells.map(numberCell);
      const metrics = Object.fromEntries(names.map((name,i)=>[name,values[i]]));
      return {model:label.replace(/\s*\[\s*\d+\s*\]/g,''),score:values[names.length],metrics,
        ...(type === 'Open.' ? {open:true} : {})};
    }),7);
  },
};
export default board;
