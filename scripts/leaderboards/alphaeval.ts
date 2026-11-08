// AlphaEval reports average task score over 94 tasks, displayed on a 0-100 percentage scale.
// Every scaffold-model configuration remains separate.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://alphaeval.ai";
const board: Leaderboard = {
 benchmark: "alphaeval", url: "https://alphaeval.ai", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.some(c=>c.text==='Scaffold'));if(!t)throw new Error('No AlphaEval table');return t.slice(1).map(r=>({model:r[2].text==='Gemini 3 Pro'?r[2].text+' [snapshot unspecified]':r[2].text,harness:r[1].text,score:num(r[3].text)!,setting:'Average of 94 tasks'}));
 },
};
export default board;
