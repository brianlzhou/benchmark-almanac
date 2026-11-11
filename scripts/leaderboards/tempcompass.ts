// TempCompass: the author Space sorts by Avg. All across all temporal tasks.
// Frame counts are whole-benchmark input configurations. Group averages remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://huggingface.co/spaces/lyx97/TempCompass/resolve/main/file/result.csv";
const board: Leaderboard = {
 benchmark: "tempcompass",
 url: "https://huggingface.co/spaces/lyx97/TempCompass/resolve/main/file/result.csv",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const rows=parseCsv(await fetchText(FEED));
 return checked(rows.map(r=>({model:r.Model.replace(/^\[([^\]]+)\]\([^)]*\)$/,'$1'),score:num(r['Avg. All'])!,setting:`frames ${r.Frames}`,metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>k.startsWith('Avg. ')&&k!=='Avg. All'&&num(v)!==undefined).map(([k,v])=>[k,num(v)!]))})),20);
 },
};
export default board;
