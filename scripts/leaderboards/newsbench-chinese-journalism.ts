// NewsBench evaluates journalistic writing proficiency and safety adherence in Chinese.
// Its first metric, JWP-Generation, uses the writing rubric. The other three columns use fractional scores.
// Read the result table embedded in the authors' published website script.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
const feed='https://iaar-shanghai.github.io/NewsBench/js/app.48ab46a4.js';
const parts={jwpGeneration:'JWP-Generation',jwpMultiple:'JWP-Multiple',saGeneration:'SA-Generation',saMultiple:'SA-Multiple'};
const board:Leaderboard={
  benchmark:'newsbench-chinese-journalism',url:'https://iaar-shanghai.github.io/NewsBench/#/leaderboard',feed,parts,
  terms:'NewsBench lists Apache 2.0 at https://github.com/IAAR-Shanghai/NewsBench.',
  aliases:{'GPT-4-1106':'gpt-4-turbo-nov-2023'},
  async fetch(){
    const table=tables(await fetchText(feed)).find(t=>t[0]?.map(c=>c.text).join('|')==='#|Model|#Parameters|Open Weights|'+Object.values(parts).join('|'));
    if(!table)throw new Error('Missing NewsBench leaderboard');
    const rows=table.slice(1).map(row=>{
      const [,model,size,weights,...values]=row.map(c=>c.text);
      if(values.length!==4||values.some(v=>!/^\d+\.\d+$/.test(v)))throw new Error('Invalid results for '+model);
      const metrics=Object.fromEntries(Object.keys(parts).map((k,i)=>[k,Number(values[i])]));
      return {model,params:size.endsWith('B')?parseFloat(size):undefined,open:weights==='√',score:metrics.jwpGeneration,metrics};
    });
    return checked(rows,12);
  },
};
export default board;
