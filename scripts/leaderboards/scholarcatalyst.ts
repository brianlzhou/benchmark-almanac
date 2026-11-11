// ScholarCatalyst: Core Research Query R@20 over 207 projects is recall, expressed as percent.
// Read the complete retriever appendix and add agent configurations from the main table.
// Other recall and nDCG metrics remain metrics. Post-cutoff comparison rows retain a setting.
// Rows are static paper results and will not refresh with later model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { paperTables as tables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';
const FEED = "https://arxiv.org/html/2610.02202";
const board: Leaderboard = {
 benchmark: "scholarcatalyst",
 url: "https://arxiv.org/html/2610.02202",
 feed: FEED,
 terms: "Public author results read with the Almanac user agent. Attribution and source licensing apply.",

 async fetch(): Promise<LeaderboardRow[]> {
const ts=flatPaperTables(await fetchText(FEED)).map(grid);const candidates=ts.filter(t=>t[1]?.join('|')==='Model|nDCG@20|R@5|R@20|R@100|nDCG@20|R@5|R@20|R@100');const main=candidates.find(t=>t[0][1].includes('207'));const full=candidates.find(t=>t.some(r=>r[0]==='SciNCL'));if(!main||!full)throw new Error('ScholarCatalyst tables missing');const rows:LeaderboardRow[]=[];
 for(const r of [...full.slice(2),...main.slice(2).filter(r=>r[0].includes(' + '))]){if(num(r[3])===undefined||new Set(r).size===1)continue;let [model,harness]=r[0].split(' + ');if(model==='Fable 5.1')model='Claude Fable 5.1';rows.push({model,harness,score:num(r[3])!*100,setting:model==='Claude Fable 5.1'?'post-cutoff comparison':undefined,metrics:{ndcg20:num(r[1])!,recall5:num(r[2])!*100,recall100:num(r[4])!*100,subfieldRecall20:num(r[7])!*100}});}return checked(rows,19);
 },
};
export default board;
