// QMSum: Table 3 reports ROUGE F1. ROUGE-1 is the first headline metric, with ROUGE-2 and ROUGE-L as metrics.
// Locator and gold-span inputs are whole-benchmark configurations. Random and extractive oracle references are excluded.
// Table 4 gives domain scores for BART with gold spans and four training sets.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';
import { paperTables as tables, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = "https://arxiv.org/html/2104.05938";
const board: Leaderboard = {
 benchmark: "qmsum", static: 'paper',
 parts: {product: {name: 'Product', group: 'Test domain'}, academic: {name: 'Academic', group: 'Test domain'}, committee: {name: 'Committee', group: 'Test domain'}},
 url: "https://arxiv.org/html/2104.05938",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const all=tables(await fetchText(FEED)).map(t=>t.map(r=>r.map(c=>c.text)));
 const t=all.find(t=>t[0]?.join('|')==='Models|R-1|R-2|R-L');
 if(!t)throw new Error('QMSum results missing');
 const rows: LeaderboardRow[] = checked(t.slice(1).filter(r=>r.length===4&&!/Random|Oracle/.test(r[0])).map(r=>({model:r[0].replace(/[∗*†]/g,''),setting:/[∗*]/.test(r[0])?'learned locator spans':r[0].includes('†')?'gold spans':'full transcript',score:num(r[1])!,metrics:{rouge2:num(r[2])!,rougeL:num(r[3])!}})),9);
 const cross = all.find(t => t[0]?.includes('Product') && t[0]?.includes('Committee'));
 for (const r of cross?.slice(2) ?? []) {
   const training = ({'Pro.':'Product', 'Aca.':'Academic', 'Com.':'Committee', All:'All'} as Record<string,string>)[r[0]];
   if (!training || r.length !== 13) continue;
   const score = num(r[10]);
   if (score === undefined) continue;
   const metrics: Record<string,number> = {};
   for (const [i, domain] of ['product','academic','committee'].entries()) {
     for (const [j, suffix] of ['', 'Rouge2', 'RougeL'].entries()) {
       const n = num(r[1 + 3*i + j]);
       if (n !== undefined) metrics[domain + suffix] = n;
     }
   }
   const existing = training === 'All' && rows.find(row => row.model === 'BART' && row.setting === 'gold spans' && row.score === score);
   if (existing) existing.metrics = {...existing.metrics, ...metrics};
   else rows.push({model:'BART', setting:'gold spans, trained on ' + training, score, metrics:{...metrics, rouge2:num(r[11])!, rougeL:num(r[12])!}});
 }
 return rows;
 },
};
export default board;
