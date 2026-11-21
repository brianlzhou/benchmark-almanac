// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CRONOS tests robotic manipulation with infrequent scene resets. The project site's spatial generalization
// table gives success rates for each policy in the Overlap and Cluttered out-of-domain layouts.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://embodiedai-ntu.github.io/cronos/';
const board: Leaderboard = {
  benchmark:'cronos',url,feed:url,
  terms:'The authors publish this results table at https://embodiedai-ntu.github.io/cronos/.',
  headline:'For spatial generalization, the authors report no overall score. This is the plain mean of the two out-of-domain layout success rates.',
  parts:{overlap:'Overlap',cluttered:'Cluttered'},
  async fetch() {
    const table = tables(await fetchText(url)).find(t => t[0]?.map(c=>c.text).join('|')==='Model|T|Overlap|Cluttered');
    if (!table) throw new Error('Missing CRONOS spatial generalization table');
    const rows = table.slice(1).map(row=>{
      const [model,t,a,b]=row.map(c=>c.text);
      if (row.length!==4 || !/^\d+$/.test(t) || ![a,b].every(v=>/^0\.\d+$|^1(?:\.0+)?$|^0$/.test(v))) throw new Error('Invalid CRONOS result');
      const overlap=Number(a),cluttered=Number(b);
      return {model,setting:'Scene reset every '+t+' steps',score:(overlap+cluttered)/2,metrics:{overlap,cluttered}};
    });
    return checked(rows,4);
  },
};
export default board;
