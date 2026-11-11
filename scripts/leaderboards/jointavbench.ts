// JointAVBench: Table 3 Avg is whole-benchmark accuracy in percent. Model sizes disambiguate the paper names.
// The fifteen task accuracies remain metrics. Separate modality ablations do not replace the headline runs.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2512.12772";
const board: Leaderboard = {
 benchmark: "jointavbench",
 url: "https://arxiv.org/html/2512.12772",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('SOOG')&&t[0]?.includes('Size'));
 if(!t)throw new Error('JointAVBench table missing');
 return checked(t.filter(r=>r.length===18&&num(r[17])!==undefined).map(r=>({model:r[0]+(/^\d+B$/.test(r[1])?' '+r[1]:''),score:num(r[17])!,metrics:Object.fromEntries(t[0].slice(2,17).map((k,i)=>[k,num(r[i+2])!]))})),17);
 },
};
export default board;
