// Vals published accuracy and per-test cost from the page’s live chart data. Table token prices are not used as task costs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import {valsRows,VALS_ALIASES} from './vals-index.ts';
const FEED = "https://www.vals.ai/benchmarks/medscribe";
const board: Leaderboard = {
 benchmark: "vals-medscribe",
 url: "https://www.vals.ai/benchmarks/medscribe",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases:Object.fromEntries(Object.entries(VALS_ALIASES).filter(([k])=>k!=='GPT 4o')),
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const rows=await valsRows("medscribe",{cost:null});const html=await fetchText(FEED);const t=tables(html)[0];
 const unpack=(v:any):any=>!Array.isArray(v)||typeof v[0]!=='number'||v.length>2?v:v.length===1?undefined:v[0]===1?v[1].map(unpack):v[1]&&typeof v[1]==='object'?Object.fromEntries(Object.entries(v[1]).map(([k,x])=>[k,unpack(x)])):v[1];
 let runs:Record<string,any>={};
 const raw=html.match(/props="(\{&quot;benchmarkView&quot;[^"]*)"/)?.[1];
 if(raw)runs=unpack([0,JSON.parse(raw.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'"))]).benchmarkView?.tasks?.overall??{};
 else {const file=html.match(/\/_astro\/benchmark_view_[\w.-]+\.json/)?.[0];if(file)runs=(await fetchJson<any>('https://www.vals.ai'+file)).tasks?.overall??{};}
 return rows.map((r,i)=>{const key=t[i+1]?.[1]?.html.match(/href="\/models\/([^"]+)"/)?.[1]?.replace('_','/');const run=key?runs[key]:null;
 return run&&typeof run.cost_per_test==='number'&&Math.abs(run.accuracy-r.score)<0.006?{...r,cost:run.cost_per_test}:r;});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
