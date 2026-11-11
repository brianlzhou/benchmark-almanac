// CC-OCR v2: Table 2 Average is the published overall document-processing score out of 100.
// Recognition, parsing, grounding, extraction, and QA scores remain metrics.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2605.03903";
const board: Leaderboard = {
 benchmark: "cc-ocr-bench-v2",
 url: "https://arxiv.org/html/2605.03903",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.includes('Document Processing Tasks'));
 if(!t)throw new Error('CC-OCR v2 table missing');
 return checked(t.filter(r=>r.length===7&&num(r[6])!==undefined).map(r=>({model:r[0],score:num(r[6])!,metrics:Object.fromEntries(['recognition','parsing','grounding','extraction','qa'].map((k,i)=>[k,num(r[i+1])!]))})),17);
 },
};
export default board;
