// SAFE-Teen assigns each conversation to one of three risk areas. Each child uses that task-family failure rate, lower is better.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../html.ts';

const FEED = "https://www.vals.ai/benchmarks/mental-health";
const board: Leaderboard = {
 benchmark: "vals-safe-teen", url: "https://www.vals.ai/benchmarks/mental-health", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const t=tables(await fetchText(FEED)).find(t=>t[0]?.[1]?.text.startsWith('Urgent safety'));if(!t)throw new Error('Missing SAFE-Teen failure table');const rows:LeaderboardRow[]=[];
for(const r of t.slice(1)){const name=r[0].text;const m=name.match(/^(.*?)\s*\(([^)]+)\)$/);const model=m?.[1]??name;for(let i=1;i<4;i++){const score=num(r[i]?.text);if(score!==undefined)rows.push({model,score,setting:[t[0][i].text,m?.[2]].filter(Boolean).join('; ')});}}return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
