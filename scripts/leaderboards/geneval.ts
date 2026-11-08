// GenEval: the official main-results table reports overall success as a 0–1 fraction. Multiply by
// 100 for the benchmark percentage unit. Keep the published CLIP retrieval baseline as its own system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://raw.githubusercontent.com/djghosh13/geneval/main/README.md";
const board: Leaderboard = {
 benchmark: "geneval", url: "https://github.com/djghosh13/geneval", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {

const md=await fetchText(FEED);const block=md.split('### Main results')[1]?.split(/^## /m)[0];if(!block)throw new Error('Main results missing');const rows:LeaderboardRow[]=[];
for(const l of block.split('\n')){const c=l.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(s=>text(s.replace(/\*\*/g,'')));if(c.length!==8)continue;const score=num(c[1]);if(score===undefined)continue;const metrics:Record<string,number>={};['singleObject','twoObjects','counting','colors','position','colorAttribution'].forEach((k,i)=>{const n=num(c[i+2]);if(n!==undefined)metrics[k]=n*100;});rows.push({model:c[0],score:score*100,metrics});}
if(!rows.length)throw new Error('No GenEval results');return rows;
 },
};
export default board;
