// DIODE tests depth estimation across indoor and outdoor scenes. The SOTA2 affine-invariant
// depth leaderboard ranks models by absolute relative error, shown as a percentage on the board.
// Divide by 100 for the relative error ratio used by DIODE and retain delta1 accuracy in percent.
import type { Leaderboard } from './types.ts';
import { tables,text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url='https://www.sota2.com/research/sota/affine-invariant-depth-estimation-on-diode-various';
const board: Leaderboard = {
  benchmark:'diode',url,feed:url,terms:'SOTA2 publishes this leaderboard at https://www.sota2.com/research/sota/affine-invariant-depth-estimation-on-diode-various.',
  parts:{delta1:{name:'Delta 1 accuracy',unit:'%',better:'higher'}},
  async fetch(){
    const table=tables(await fetchText(url)).find(t=>t[0]?.map(c=>c.text).join('|')==='Method|Links|AbsRel|delta1');
    if(!table) throw new Error('Missing DIODE depth estimation leaderboard');
    const rows=table.slice(1).map(([name,,error,delta])=>{
      const model=text(name.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1]??'').replace(/\*$/,'').replace(/ \(ours\)$/i,'');
      const setting=text(name.html.match(/role="tooltip">([\s\S]*?)<\/span>/)?.[1]??'');
      if(!model || !setting || ![error,delta].every(c=>/^\d+(\.\d+)?$/.test(c.text))) throw new Error('Invalid DIODE leaderboard row');
      return {model,setting,score:Number(error.text)/100,metrics:{delta1:Number(delta.text)}};
    });
    return checked(rows,27);
  },
};
export default board;
