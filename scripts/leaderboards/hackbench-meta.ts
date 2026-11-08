// HackBench: the monitor table reports command-localization F1, with precision and recall as metrics.
// These scores concern hack detection, not the paper other benchmark construction experiments.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2610.38882";
const board: Leaderboard = {
 benchmark: "hackbench-meta",
 url: "https://arxiv.org/html/2610.38882",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|').replace(/\s/g,'')==='Model|Precision|Recall|F1');
 if(!t)throw new Error('HackBench localization table missing');
 return checked(t.slice(1).filter(r=>r.length===4).map(r=>({model:r[0],score:num(r[3])!,metrics:{precision:num(r[1])!,recall:num(r[2])!}})),8);
 },
};
export default board;
