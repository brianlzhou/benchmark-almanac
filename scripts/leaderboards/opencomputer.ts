// OpenComputer headline is its own environment task success percentage, not the adjacent OSWorld comparison.
// Average reward and steps remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://echo0715.github.io/OpenComputer/";
const board: Leaderboard = {
 benchmark: "opencomputer", url: "https://echo0715.github.io/OpenComputer/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Avg. Reward'));if(!t)throw new Error('No leaderboard');return t.slice(1).map(r=>({model:r[1].text.replace(/ Best$/,''),score:num(r[3].text)!,metrics:{OSWorld:num(r[2].text)!,averageReward:num(r[4].text)!,averageSteps:num(r[5].text)!}}));
 },
};
export default board;
