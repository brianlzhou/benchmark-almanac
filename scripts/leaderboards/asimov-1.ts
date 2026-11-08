// ASIMOV v1: Appendix Table 5 publishes Average Alignment across all tasks and both normal and adversarial modes.
// The caption identifies Gemini 1.5 Pro as the base model. Constitutions change the whole-benchmark prompt.
// Normal and adversarial alignment remain metrics. The Random reference is excluded.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2503.08663";
const board: Leaderboard = {
 benchmark: "asimov-1",
 url: "https://arxiv.org/html/2503.08663",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(grid).filter(t=>t[0]?.[8]==='Average Alignm.').sort((a,b)=>b.length-a.length)[0];if(!t)throw new Error('ASIMOV full alignment table missing');
 return checked(t.slice(1).filter(r=>r[0]!=='Random').map(r=>({model:'Gemini 1.5 Pro (snapshot unspecified)',setting:r[0]+' ('+r[5]+' characters)',score:num(r[8])!,metrics:{normal:num(r[6])!,adversarial:num(r[7])!}})),85);
 },
};
export default board;
