// Veris ranks voice agents by task completion on utility billing calls. Its standings name each speech model or cascade and give call cost and latency.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://veris.ai/leaderboard/vamos-pro";


const board: Leaderboard = {
  benchmark: "vamos-pro-bench",
  url: "https://veris.ai/leaderboard/vamos-pro",
  feed,
  terms: "Veris reserves all rights. The public terms give no separate permission to reproduce leaderboard tables. https://veris.ai/terms-and-conditions The public leaderboard path is allowed in robots.txt.",
  harnesses:'system',
  async fetch(){
    const t=tables(await fetchText(feed)).find(t=>t[0].map(c=>c.text).join('|')==='Voice agent|Task completion|Latency|Turns|Barge-in/call|Cost|Type|Model');
    if(!t || t.length<21) throw new Error('Incomplete voice agent standings');
    return t.slice(1).map(c=>{
      const [harness,rate,latency,turns,barge,cost,setting,pipeline]=c.map(v=>v.text);
      const models=pipeline.split(/\s*(?:&rarr;|→)\s*/);
      const model=models.length===3?models[1]:models[0];
      const score=parseFloat(rate),price=Number(cost.replace(/^~?\$/,''));
      const metrics={latency:parseFloat(latency),turns:Number(turns),bargeInPerCall:Number(barge)};
      if(!model || !harness || ![score,price,...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid voice agent');
      return {model,models:models.length>1?models:undefined,harness,score,setting,cost:price,metrics};
    });
  },
};
export default board;
