// VisualWebBench: Table 1 Average is the published overall score out of 100. Seven task scores remain metrics.
// The paper names Claude Sonnet and Opus without versions, so those rows remain unlisted.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2404.05955";
const board: Leaderboard = {
 benchmark: "visualwebbench",
 url: "https://arxiv.org/html/2404.05955",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|')==='Model|Website|Element|Action|Average');
 if(!t)throw new Error('VisualWebBench table missing');
 return checked(t.filter(r=>r.length===9 && num(r[8])!==undefined).map(r=>({model:/^Claude (Sonnet|Opus)$/.test(r[0])?r[0]+' (snapshot unspecified)':r[0],score:num(r[8])!,metrics:Object.fromEntries(['caption','webQA','headingOCR','elementOCR','elementGrounding','actionPrediction','actionGrounding'].map((k,i)=>[k,num(r[i+1])!]))})),22);
 },
};
export default board;
