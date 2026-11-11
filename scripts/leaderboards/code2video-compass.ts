// The default Overall view ranks by Avg. Rank, lower is better. The page states: "Avg. Rank averages per-metric ranks across all 15 models, excluding Operational metrics (ES and TC); ties receive average ranks." This reader follows app.js. TC is API output tokens per attempted task, including reasoning.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://code2video-compass.github.io/benchmark-data.js?v=55";
const board: Leaderboard = {
  benchmark: "code2video-compass",
  url: "https://code2video-compass.github.io/benchmark-data.js?v=55",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const d=jsonAfter(await fetchText(FEED),'window.COMPASS_DATA =') as any;
const overall=d.results.filter((r:any)=>r.setting==='Overall');
const quality=d.metrics.filter((m:any)=>m.group!=='Operational');
const ranks=new Map<string,number[]>();
for(const k of quality){const rr=overall.filter((r:any)=>r.metrics[k.id]?.value!=null).sort((a:any,b:any)=>(k.direction==='down'?1:-1)*(a.metrics[k.id].value-b.metrics[k.id].value));
 for(let i=0;i<rr.length;){let j=i+1;while(j<rr.length&&Math.abs(rr[j].metrics[k.id].value-rr[i].metrics[k.id].value)<1e-12)j++;for(let p=i;p<j;p++)ranks.set(rr[p].model,[...(ranks.get(rr[p].model)||[]),((i+1)+j)/2]);i=j;}}
return overall.map((r:any)=>{const m=d.models.find((m:any)=>m.id===r.model);const rank=ranks.get(r.model)!;if(rank.length!==quality.length)throw new Error('Incomplete overall ranks');return {model:m.name,score:rank.reduce((a,b)=>a+b,0)/rank.length,setting:m.reasoning==='fixed'?undefined:m.reasoning,tokens:r.metrics.TC.value,metrics:Object.fromEntries(Object.entries(r.metrics).map(([k,v]:[string,any])=>[k,v.value]))};});

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
