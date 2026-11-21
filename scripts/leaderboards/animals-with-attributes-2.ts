// Animals with Attributes 2 tests zero-shot species classification. The makers' Results table
// gives class-averaged multiclass accuracy in percent. Use the proposed split marked preferred
// by the authors and preserve the original split for AwA2. The neighboring AwA1 columns score another dataset.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const url='https://cvml.ista.ac.at/AwA2/';
const board:Leaderboard={
  benchmark:'animals-with-attributes-2',url,feed:url,terms:'The dataset authors publish these results and request citation at https://cvml.ista.ac.at/AwA2/.',
  parts:{original:{name:'Original split',unit:'%'},proposed:{name:'Proposed split (preferred)',unit:'%'}},
  async fetch(){
    const t=tables(await fetchText(url)).map(grid).find(t=>t[0]?.slice(-2).join('|')==='AwA2|AwA2' &&
      t[1]?.slice(-2).join('|')==='original split|proposed split (preferred)');
    if(!t) throw new Error('Missing AwA2 accuracy columns');
    const rows=t.slice(2).map(r=>{
      const model=r[0].replace(/\s*\[[a-z]+\]$/,'');
      if(!r.slice(3).every(s=>/^\d+(?:\.\d+)?$/.test(s)) || r.length!==5) throw new Error('Invalid score for '+model);
      return {model,score:Number(r[4]),metrics:{original:Number(r[3]),proposed:Number(r[4])}};
    });
    return checked(rows,13);
  },
};
export default board;
