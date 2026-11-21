// RPEval ranks roleplaying models by the mean of three percentages. Its Space bundle publishes the component scores and rounds the mean to two decimals.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';

const feed = "https://huggingface.co/spaces/yelboudouri/RPEval/raw/main/assets/index.js";
const tasks=['Emotional Understanding','Decision-Making/Moral Alignment','In-Character Consistency'];

const board: Leaderboard = {
  benchmark: "rpeval-el-boudouri",
  url: "https://huggingface.co/spaces/yelboudouri/RPEval",
  feed,
  terms: "The dataset lists Apache-2.0. The leaderboard does not state separate reuse terms. https://huggingface.co/datasets/yelboudouri/RPEval https://huggingface.co/spaces/yelboudouri/RPEval Hugging Face allows crawling.",
  parts:Object.fromEntries(tasks.map(k=>[k,k])),
  async fetch(){
    const js=await fetchText(feed);
    const at=js.search(/\[\{Model:"[^"]+","Emotional Understanding":/);
    if(at<0) throw new Error('Missing RPEval scores');
    const records=jsLiteral<(Record<string,number>&{Model:string})[]>(js,at);
    if(records.length<12) throw new Error('Incomplete RPEval table');
    return records.map(r=>{
      const metrics=Object.fromEntries(tasks.map(k=>[k,r[k]]));
      if(!r.Model || !Object.values(metrics).every(Number.isFinite)) throw new Error('Invalid roleplaying score');
      return {model:r.Model,score:Number((Object.values(metrics).reduce((s,v)=>s+v,0)/3).toFixed(2)),metrics};
    });
  },
};
export default board;
