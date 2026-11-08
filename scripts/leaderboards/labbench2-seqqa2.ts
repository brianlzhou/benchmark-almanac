// LABBench2 SeqQA2 mean score converted from fractions to accuracy percentages.
// Retains tool/effort variants, input modes, dates, output tokens and duration.
// Retry labels identify repeated runs, not configurations; keep the latest run per configuration.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://advances.edisonscientific.com/benchmarks/labbench2/seqqa2/";
const board: Leaderboard = {
 benchmark: "labbench2-seqqa2", url: "https://advances.edisonscientific.com/benchmarks/labbench2/seqqa2/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text.startsWith('Average score')));if(!t)throw new Error('Missing SeqQA2 table');const rows:LeaderboardRow[]=[];
function scaled(s:string){const m=s.match(/^([\d.]+)\s*([kKmMs]?)$/);if(!m)return undefined;return Number(m[1])*({k:1000,m:1000000}[m[2].toLowerCase()]??1);}
for(const r of t.slice(1)){const score=num(r[4]?.text);if(score===undefined)continue;const variant=r[2].text.replace(/(?:_retry)+$/,''),mode=r[3].text;
 const duration=r[6].text.match(/^([\d.]+)([smh])$/);const latency=duration?Number(duration[1])*({s:1,m:60,h:3600}[duration[2]]??1):undefined;
 rows.push({model:r[1].text.replace(/(?:_retry)+$/,''),score:score*100,setting:['mode '+mode,variant!=='—'?variant:undefined].filter(Boolean).join('; '),harness:variant.includes('tools')?'LABBench2 tools':'LABBench2',tokens:scaled(r[5].text),date:r[7].text,metrics:latency===undefined?undefined:{latency}});}
const latest=new Map<string,LeaderboardRow>();for(const row of rows){const key=JSON.stringify([row.model,row.setting,row.harness]);const previous=latest.get(key);if(!previous||(row.date??'')>(previous.date??''))latest.set(key,row);}return [...latest.values()];
 },
};
export default board;
