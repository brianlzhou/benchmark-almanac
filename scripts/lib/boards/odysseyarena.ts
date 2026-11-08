// OdysseyArena-Lite defines four environment task families. Read avg@4, keeping pass@4 as a metric. Trading returns retain native percentage units.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText, fetchJson, parseCsv } from '../util.ts';
import { tables, num, text, jsonAfter, jsLiteral, nextFlight } from '../html.ts';

const FEED = "https://yayayacc.github.io/Odyssey-Home/";
const board: Leaderboard = {
 benchmark: "odysseyarena", url: "https://yayayacc.github.io/Odyssey-Home/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',

 async fetch() {
const html=await fetchText(FEED); const data=jsLiteral<any[]>(html,html.indexOf('[',html.indexOf('rowData:'))); if(!Array.isArray(data))throw new Error('Missing Odyssey grid');
 const rows:LeaderboardRow[]=[];
 for(const d of data){let model=d.model;const effort=model.match(/\((high|medium|low)\)/i)?.[1];model=model.replace(/\s*\((high|medium|low)\)/i,'');if(['Gemini 2.5 Pro','Gemini 3 Pro Preview'].includes(model))model+=' [snapshot unspecified]';
 const metrics={tradingAvg4Return:num(d.aiTradingAvg4)!,tradingPass4Return:num(d.aiTradingPass4)!};
 for(const task of ['turnOnLights','energyDispatch','repoSystem','aiTrading'])for(const protocol of ['Avg4','Pass4']){const score=num(String(d[task+protocol]));if(typeof score==='number' && protocol==='Avg4')rows.push({model,score,setting:['OdysseyArena-Lite',task,protocol,effort].filter(Boolean).join('; '),metrics:{passAt4:num(String(d[task+'Pass4']))!}});}}
 if(!rows.length)throw new Error('No Odyssey scores');return rows;
 },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
