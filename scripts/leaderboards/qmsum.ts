// QMSum: Table 3 reports ROUGE F1. ROUGE-1 is the first headline metric, with ROUGE-2 and ROUGE-L as metrics.
// Locator and gold-span inputs are whole-benchmark configurations. Random and extractive oracle references are excluded.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, grid, checked, uncertain } from '../lib/boards/arxiv-h2.ts';

const FEED = "https://arxiv.org/html/2104.05938";
const board: Leaderboard = {
 benchmark: "qmsum",
 url: "https://arxiv.org/html/2104.05938",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const t=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text))).find(t=>t[0]?.join('|')==='Models|R-1|R-2|R-L');
 if(!t)throw new Error('QMSum results missing');
 return checked(t.slice(1).filter(r=>r.length===4&&!/Random|Oracle/.test(r[0])).map(r=>({model:r[0].replace(/[∗*†]/g,''),setting:/[∗*]/.test(r[0])?'learned locator spans':r[0].includes('†')?'gold spans':'full transcript',score:num(r[1])!,metrics:{rouge2:num(r[2])!,rougeL:num(r[3])!}})),9);
 },
};
export default board;
