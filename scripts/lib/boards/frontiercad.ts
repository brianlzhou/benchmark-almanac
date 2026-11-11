// FrontierCAD uses separate parts and assembly test sets. Each child reads the published native 0-1 mean. Original evaluation drawings remain identified.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { jsonAfter, nextFlight } from '../html.ts';

const FEED = "https://normal.ai/research/frontiercad";
const board: Leaderboard = {
 benchmark: "frontiercad", url: "https://normal.ai/research/frontiercad", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const flight=nextFlight(await fetchText(FEED));const rows:LeaderboardRow[]=[];let count=0;for(const match of flight.matchAll(/"models":\[\{"scheduled":/g)){const data=jsonAfter<any[]>(flight.slice(match.index),'"models":');const split=count++===0?'Parts':'Assemblies';for(const r of data){const [harness,effort]=r.reasoning.split(' · ');rows.push({model:r.label,harness,setting:`${split}; ${effort}; original evaluation inputs`,score:r.mean,metrics:{scheduled:r.scheduled,scored:r.scored,scoreLow:r.interval.lower,scoreHigh:r.interval.upper,passRate:r.passRate*100,tokenCoverage:r.tokenCoverage,turnCoverage:r.turnCoverage,...(typeof r.meanTokens==='number'?{meanTotalTokens:r.meanTokens}:{}),...(typeof r.meanTurns==='number'?{meanTurns:r.meanTurns}:{})}});}}if(count!==2)throw new Error('Expected part and assembly leaderboards');return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
