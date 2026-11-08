// AMemGym v1.base: overall mean accuracy, multiplied by 100.
// The official bundle publishes overall model and memory-agent tables. Period scores remain metrics. Random baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://agi-eval-official.github.io/amemgym";
const board: Leaderboard = {
  benchmark: "amemgym",
  url: "https://agi-eval-official.github.io/amemgym",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const page=await fetchText(FEED);const src=page.match(/src="([^" ]*assets\/index-[^" ]+\.js)"/);if(!src)throw new Error('AMemGym bundle missing');await new Promise(r=>setTimeout(r,1100));const s=await fetchText(new URL(src[1],FEED+'/').href);
      const out:LeaderboardRow[]=[];
      for(const key of ['overall_llm_leaderboard','overall_agent_leaderboard']){const name=s.match(new RegExp(key+':([\\w$]+)'))?.[1];if(!name)throw new Error('AMemGym table missing');const p=s.indexOf(name+'={');const normalized=s.slice(p+name.length+1).replace(/([:[,]\s*)(-?)\.(\d)/g,(_,a,b,c)=>a+b+'0.'+c);const d=jsLiteral<any>(normalized,0);
      for(const [name,v] of Object.entries(d.data) as [string,number[]][]){if(name==='random')continue;const m=name.match(/^(.*)-(xhigh|high|none|thinking)$/);out.push({model:m?m[1]:name,setting:m?.[2],harness:key==='overall_agent_leaderboard'?'memory agent':undefined,score:v[1]*100,metrics:Object.fromEntries(d.columns.filter((_:string,i:number)=>i!==1).map((k:string)=>[k,v[d.columns.indexOf(k)]*100]))});}}
      return out;
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|gemini[- ]?2[.](?:0|5)[- ]?flash(?:[- ]?lite)?|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
