// EgoLifeQA: Table 5 Average covers all five question families with EgoButler memory.
// Caption input, audio and identity options are whole-benchmark configurations.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2503.03803";
const board: Leaderboard = {
 benchmark: "egolife-with-memory",
 url: "https://arxiv.org/html/2503.03803",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).find(t=>t[1]?.[4]==='EntityLog'&&t[1]?.[9]==='Average');if(!t)throw new Error('EgoLifeQA table missing');
 return checked(t.slice(2).map(r=>({model:r[0],score:num(r[9])!,harness:'EgoButler',setting:`frames ${r[1]}, audio ${r[2]}, identity ${r[3]}`,metrics:Object.fromEntries(['entityLog','eventRecall','habitInsight','relationMap','taskMaster'].map((k,i)=>[k,num(r[i+4])!]))})),5);
 },
};
export default board;
