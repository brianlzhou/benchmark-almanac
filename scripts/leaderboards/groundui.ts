// GroundUI: total UI grounding accuracy in percent. Read the first Web/Desktop/Mobile table,
// under GroundUI, not the later CriticBench tables. Retain platform accuracies and submission dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../lib/html.ts';

const FEED = "https://ltzheng.github.io/agent-studio";
const board: Leaderboard = {
 benchmark: "groundui", url: "https://ltzheng.github.io/agent-studio", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:{'gpt-4o-2024-08-06':'gpt-4o-aug-2024','gpt-4o-2024-05-13':'gpt-4o-may-2024','gemini-1.5-pro-001':'gemini-1-5-pro-may-2024','gemini-1.5-flash-001':'gemini-1-5-flash-may-2024'},
 async fetch() {

const html=await fetchText(FEED);const start=html.indexOf('GroundUI Leaderboard');if(start<0)throw new Error('GroundUI heading missing');const t=tables(html.slice(start))[0];if(t?.[0]?.map(c=>c.text).join('|')!=='Model|Web|Desktop|Mobile|Total|Date|Logs')throw new Error('GroundUI table changed');return t.slice(1).flatMap(r=>{const score=num(r[4]?.text);return score===undefined?[]:[{model:r[0].text,score,date:r[5].text,metrics:{web:num(r[1].text)!,desktop:num(r[2].text)!,mobile:num(r[3].text)!}}];});
 },
};
export default board;
