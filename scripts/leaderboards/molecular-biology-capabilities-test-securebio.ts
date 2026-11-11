// MBCT: raw accuracy percentages from SecureBio chart hover text, not the rescaled trend axis.
// Preserve reasoning budgets, release dates, confidence intervals and refusal rates. Deduplicate
// repeated grouping traces; omit points the source flags as unreliable due to excessive refusals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { num, text } from '../lib/html.ts';
import {sbCharts,SB_ALIASES} from './hpct-v2-securebio.ts';
const FEED = "https://securebio.org/benchmarks/details/";
const board: Leaderboard = {
 benchmark: "molecular-biology-capabilities-test-securebio", url: "https://securebio.org/benchmarks/", feed: FEED,
 terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
aliases:SB_ALIASES,
 async fetch() {

const charts=(await sbCharts()).filter(c=>/Model performance on MBCT$/.test(c.title));if(!charts.length)throw new Error('MBCT chart missing');const rows=new Map<string,LeaderboardRow>();
for(const c of charts)for(const h of c.hovers){const lines=h.split(/<br\s*\/?\s*>/i).map(text).filter(Boolean);const m=lines.find(l=>l.startsWith('Accuracy:'))?.match(/Accuracy:\s*([\d.]+)%\s*\[([\d.]+)%,\s*([\d.]+)%\]/);if(!m||lines.some(l=>/too many refusals/i.test(l)))continue;const name=lines[0].match(/^(.*?)(?:\s*\[([^\]]+)\])?$/)!;const refusal=num(lines.find(l=>l.startsWith('Refusals:')));rows.set(lines[0],{model:name[1].trim(),score:Number(m[1]),setting:name[2]?.toLowerCase(),date:lines.find(l=>l.startsWith('Released:'))?.match(/\d{4}-\d\d-\d\d/)?.[0],metrics:{ciLow:Number(m[2]),ciHigh:Number(m[3]),...(refusal===undefined?{}:{refusalRate:refusal})}});}
return [...rows.values()];
 },
};
export default board;
