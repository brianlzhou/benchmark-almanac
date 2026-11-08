// FrontierChallenge historical pass rates use native Score >=99.9 over 97 tasks.
// They have not been recomputed under the current strict task_score >0.999 policy.
// The page links the current script asset, parsed as data without executing code.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://apodexai.github.io/FrontierAgent/benchmarks/FrontierChallenge/";
const board: Leaderboard = {
 benchmark: "frontierchallenge", url: "https://apodexai.github.io/FrontierAgent/benchmarks/FrontierChallenge/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const html=await fetchText(FEED);const script=html.match(/src="(script\.js[^"]*)"/)?.[1];if(!script)throw new Error('Missing results script');await new Promise(r=>setTimeout(r,1100));const js=await fetchText(new URL(script,FEED).href);const data=jsonAfter<any[]>(js,'const results =');
 return data.map(r=>({model:r[0].replace(/\s*\(max\)/,''),harness:r[1],score:r[3],setting:'Historical native Score >=99.9; 97 tasks'+(r[0].includes('(max)')?'; max':''),metrics:{nativeMeanScore:r[4]}}));
 },
};
export default board;
