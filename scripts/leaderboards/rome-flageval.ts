// FlagEval defines ROME as its visual reasoning benchmark. The visual leaderboard CSV reports mean accuracy and standard deviation over four runs.
import type { Leaderboard } from './types.ts';
import { fetchText,parseCsv } from '../lib/util.ts';

const feed = "https://flageval-baai.github.io/LRM-Eval/data/rome/accuracy_table.csv";
const tasks=['Puzzles Games','Spatial','Recognition','Multi','Diagrams','Geo','Academic','Memes'];

const board: Leaderboard = {
  benchmark: "rome-flageval",
  url: "https://flageval-baai.github.io/LRM-Eval/",
  feed,
  terms: "The publisher displays results at https://flageval-baai.github.io/LRM-Eval/. I could not verify reuse terms. The robots.txt route returns HTML.",
  parts:Object.fromEntries(tasks.map(k=>[k,k])),
  async fetch(){
    const records=parseCsv(await fetchText(feed));
    if(records.length<33) throw new Error('Missing visual models');
    return records.map(r=>{
      const pair=(k:string)=>{
        const m=r[k]?.match(/^([\d.]+)\s*±\s*([\d.]+)$/);
        if(!m) throw new Error('Invalid '+k+' for '+r.Model);
        return [Number(m[1]),Number(m[2])];
      };
      const [score,sd]=pair('Overall'); const metrics:Record<string,number>={std:sd};
      for(const k of tasks) [metrics[k],metrics[k+'Std']]=pair(k);
      if(!r.Model) throw new Error('Missing visual model');
      return {model:r.Model,score,low:score-sd,high:score+sd,trials:4,metrics};
    });
  },
};
export default board;
