// Ramp's accounting leaderboard defaults to mean rubric reward across three attempts. The results page loads model aggregates from its accounting benchmark module.
// The results separate pass@3 from pass^3 and distinguish mean token counts from medians.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { jsLiteral } from "../lib/html.ts";
const measureKeys: Record<string, string> = {
  passPower3: 'pass3',
  meanInputTokens: 'inputTokens',
  meanOutputTokens: 'outputTokens',
  meanTotalTokens: 'totalTokens',
};

const board: Leaderboard = {
  benchmark: "ramp-accounting-bench",
  url: "https://labs.ramp.com/accountingbench",
  feed: "https://labs.ramp.com/accountingbench",
  terms: "Ramp links its terms at https://ramp.com/legal/ramp-labs-terms. I could not verify a data reuse license. Ramp Labs serves its application HTML at /robots.txt.",
  reference: ["Mercor Archipelago"],
  async fetch() {
    const html = await fetchText(this.url);
    const entry = html.match(/src="(\/assets\/main-[\w-]+\.js)"/)?.[1];
    if (!entry) throw new Error('Ramp entry bundle missing');
    const read = async (path:string) => { await new Promise(resolve=>setTimeout(resolve,1050)); return fetchText(new URL(path,this.url).href); };
    const main = await read(entry);
    const asset = main.match(/(?:assets\/|\.\/)(UnsettledAccountingBench-[\w-]+\.js)/)?.[1];
    if (!asset) throw new Error('Ramp accounting chart missing');
    const js = await read('/assets/'+asset);
    const match = /\[\{id:"[^"]+",displayName:"[^"]+",provider:"[^"]+",sourceModel:/.exec(js);
    if (!match) throw new Error('Missing Ramp model metrics');
    const source = js.slice(match.index).replace(/([:,\[])\.(\d)/g,'$10.$2').replace(/:!(0|1)(?=,|})/g,(_,b)=>b==='0'?':true':':false');
    const data = jsLiteral<{displayName:string,completedAt:string,metrics:Record<string,number>}[]>(source,0);
    if (data.length < 18) throw new Error('Incomplete accounting leaderboard');
    return data.map(r=>{
      const m = r.metrics;
      if (![m.meanCriteriaAt3,m.passAt3,m.meanCost,m.meanOutputTokens,m.meanDurationMinutes].every(Number.isFinite)) throw new Error('Missing accounting measures');
      const metrics = Object.fromEntries(Object.entries(m).filter(([,v])=>typeof v==='number').map(([key, value]) => [measureKeys[key] ?? key, value]));
      metrics.latency = 60*m.meanDurationMinutes;
      return {model:r.displayName,score:100*m.meanCriteriaAt3,date:r.completedAt.slice(0,10),trials:3,harness:'Mercor Archipelago',cost:m.meanCost,tokens:m.meanOutputTokens,metrics};
    });
  },
};
export default board;
